import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import type { WASocket } from '@whiskeysockets/baileys';
import { PrismaService } from '../../core/database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';

@Injectable()
export class WhatsappSessionManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappSessionManager.name);
  private readonly sessions = new Map<string, WASocket>();
  private readonly debounceSessionSave = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('whatsapp-queue') private readonly whatsappQueue: any,
  ) { }

  async onModuleInit() {
    try {
      const activeSessions = await this.prisma.whatsAppSession.findMany({
        where: {
          OR: [
            { isConnected: true },
            { sessionData: { not: null } },
          ],
        },
      });
      for (const session of activeSessions) {
        this.logger.log(`Restoring WhatsApp session for tenant: ${session.tenantId}`);
        if (session.sessionData) {
          this.restoreSessionFromDb(session.tenantId, session.sessionData);
        }
        this.initSession(session.tenantId).catch(err => {
          this.logger.error(`Failed to restore session for tenant ${session.tenantId}: ${err.message}`);
        });
      }
    } catch (e: any) {
      this.logger.error(`Error restoring sessions: ${e.message}`);
    }
  }

  onModuleDestroy() {
    for (const sock of this.sessions.values()) {
      try {
        sock.end(undefined);
      } catch { }
    }
    this.sessions.clear();
    // Clear all pending save debounces
    for (const timeout of this.debounceSessionSave.values()) {
      clearTimeout(timeout);
    }
    this.debounceSessionSave.clear();
  }

  getSessionSocket(tenantId: string): WASocket | undefined {
    return this.sessions.get(tenantId);
  }

  private triggerSessionSave(tenantId: string) {
    const existing = this.debounceSessionSave.get(tenantId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      this.saveSessionToDb(tenantId);
      this.debounceSessionSave.delete(tenantId);
    }, 2000); // 2-second debounce for batch writes

    this.debounceSessionSave.set(tenantId, timeout);
  }

  private async saveSessionToDb(tenantId: string) {
    const authDir = path.join(process.cwd(), 'storage', 'whatsapp-auth', tenantId);
    if (!fs.existsSync(authDir)) return;

    try {
      const files = fs.readdirSync(authDir);
      const sessionDataMap: Record<string, string> = {};

      for (const file of files) {
        const filePath = path.join(authDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          const content = fs.readFileSync(filePath, 'utf-8');
          sessionDataMap[file] = content;
        }
      }

      await this.prisma.whatsAppSession.update({
        where: { tenantId },
        data: {
          sessionData: JSON.stringify(sessionDataMap),
        },
      });
      this.logger.debug(`Saved WhatsApp session credentials to DB for tenant ${tenantId}`);
    } catch (e: any) {
      this.logger.error(`Failed to save WhatsApp session to DB for tenant ${tenantId}: ${e.message}`);
    }
  }

  private restoreSessionFromDb(tenantId: string, sessionDataStr: string) {
    const authDir = path.join(process.cwd(), 'storage', 'whatsapp-auth', tenantId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    try {
      const sessionDataMap = JSON.parse(sessionDataStr) as Record<string, string>;
      for (const [file, content] of Object.entries(sessionDataMap)) {
        const filePath = path.join(authDir, file);
        fs.writeFileSync(filePath, content, 'utf-8');
      }
      this.logger.log(`Restored WhatsApp session credentials from DB for tenant ${tenantId}`);
    } catch (e: any) {
      this.logger.error(`Failed to restore WhatsApp session credentials from DB for tenant ${tenantId}: ${e.message}`);
    }
  }

  async initSession(tenantId: string): Promise<void> {
    this.logger.log(`[initSession] Starting initialization for tenant: ${tenantId}`);
    try {
      if (this.sessions.has(tenantId)) {
        this.logger.log(`[initSession] Tenant ${tenantId} already has an active session in memory.`);
        return;
      }

      const authDir = path.join(process.cwd(), 'storage', 'whatsapp-auth', tenantId);
      this.logger.log(`[initSession] Auth directory path: ${authDir}`);

      // Ensure directory structure
      try {
        if (!fs.existsSync(path.dirname(authDir))) {
          this.logger.log(`[initSession] Creating directory: ${path.dirname(authDir)}`);
          fs.mkdirSync(path.dirname(authDir), { recursive: true });
        }
        if (!fs.existsSync(authDir)) {
          this.logger.log(`[initSession] Creating directory: ${authDir}`);
          fs.mkdirSync(authDir, { recursive: true });
        }

        // Test write access
        const testFile = path.join(authDir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        this.logger.log(`[initSession] Filesystem write check passed for path: ${authDir}`);
      } catch (fsErr: any) {
        this.logger.error(`[initSession] Filesystem write test failed for ${authDir}: ${fsErr.message}`);
        throw fsErr;
      }

      // Dynamically import @whiskeysockets/baileys
      this.logger.log(`[initSession] Importing @whiskeysockets/baileys...`);
      const baileysModule = await (Function('return import("@whiskeysockets/baileys")')() as Promise<any>);
      this.logger.log(`[initSession] Imported @whiskeysockets/baileys successfully.`);
      const makeWASocket = baileysModule.default;
      const { useMultiFileAuthState, DisconnectReason } = baileysModule;

      this.logger.log(`[initSession] Fetching multi file auth state...`);
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      this.logger.log(`[initSession] Multi file auth state resolved.`);

      // Wrap keys.set to backup session keys on changes
      if (state.keys && state.keys.set) {
        const originalSet = state.keys.set;
        state.keys.set = async (data) => {
          this.logger.debug(`[initSession] Key changes detected, setting keys and triggering DB backup...`);
          await originalSet(data);
          this.triggerSessionSave(tenantId);
        };
      }

      this.logger.log(`[initSession] Creating WASocket...`);
      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'debug' }), // Set level to debug to catch internal details
      });
      this.logger.log(`[initSession] WASocket created successfully.`);

      this.sessions.set(tenantId, sock);

      sock.ev.on('creds.update', async () => {
        this.logger.log(`[initSession] creds.update event triggered for tenant: ${tenantId}`);
        await saveCreds();
        this.triggerSessionSave(tenantId);
      });

      // Set up incoming messages listener for auto-replies
      sock.ev.on('messages.upsert', async (m) => {
        const { messages, type } = m;
        this.logger.log(`[initSession] messages.upsert event: type=${type}, count=${messages?.length}`);
        if (type !== 'notify') return;

        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          const senderJid = msg.key.remoteJid;
          if (!senderJid || !senderJid.endsWith('@s.whatsapp.net')) continue;

          const fromPhone = senderJid.split('@')[0];
          const bodyText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
          if (!bodyText) continue;

          // Persist inbound message to database
          try {
            const session = await this.prisma.whatsAppSession.findUnique({
              where: { tenantId },
            });
            if (session) {
              const customer = await this.prisma.customer.findFirst({
                where: { tenantId, phone: fromPhone },
              });

              await this.prisma.whatsAppMessage.create({
                data: {
                  tenantId,
                  sessionId: session.id,
                  customerId: customer?.id || null,
                  direction: 'INBOUND',
                  to: session.phoneNumber || 'SYSTEM',
                  from: fromPhone,
                  body: bodyText,
                  messageId: msg.key.id || `msg_in_${Date.now()}`,
                  isRead: false,
                  sentAt: new Date(),
                },
              });

              // Match and trigger Auto Replies
              const rules = await this.prisma.whatsAppAutoReplyRule.findMany({
                where: { tenantId, isActive: true },
              });

              if (rules.length > 0) {
                let matchedRule: any = null;
                const cleanText = bodyText.toLowerCase().trim();

                // 1. Keyword match
                matchedRule = rules.find(
                  (r) =>
                    r.triggerType === 'KEYWORD' &&
                    r.keywords &&
                    r.keywords
                      .split(',')
                      .some((kw) => cleanText.includes(kw.trim().toLowerCase())),
                );

                // 2. Office Hours Outside match
                if (!matchedRule) {
                  const outsideHours = await this.isOutsideOfficeHours(tenantId);
                  if (outsideHours) {
                    matchedRule = rules.find((r) => r.triggerType === 'OFFICE_HOURS_OUTSIDE');
                  }
                }

                // 3. Welcome match
                if (!matchedRule) {
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  const recentOutboundCount = await this.prisma.whatsAppMessage.count({
                    where: {
                      tenantId,
                      direction: 'OUTBOUND',
                      to: fromPhone,
                      createdAt: { gte: oneDayAgo },
                    },
                  });
                  if (recentOutboundCount === 0) {
                    matchedRule = rules.find((r) => r.triggerType === 'WELCOME');
                  }
                }

                if (matchedRule) {
                  this.logger.log(
                    `Auto-reply matched for tenant ${tenantId}: triggerType=${matchedRule.triggerType}, replying: "${matchedRule.replyText}"`,
                  );

                  // Queue response via BullMQ
                  await this.whatsappQueue.add('send-message', {
                    tenantId,
                    to: fromPhone,
                    body: matchedRule.replyText,
                  });
                }
              }
            }
          } catch (e: any) {
            this.logger.error(`Error processing inbound message: ${e.message}`, e.stack);
          }
        }
      });

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        this.logger.log(`[initSession] connection.update: connectionState=${connection}, qrExists=${!!qr}`);

        if (qr) {
          this.logger.log(`New QR code generated for tenant ${tenantId}`);
          await this.prisma.whatsAppSession.update({
            where: { tenantId },
            data: { qrCode: qr, isConnected: false },
          });
        }

        if (connection === 'open') {
          const phone = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';
          this.logger.log(`WhatsApp session opened for tenant ${tenantId} (${phone})`);
          await this.prisma.whatsAppSession.update({
            where: { tenantId },
            data: { isConnected: true, qrCode: null, phoneNumber: phone },
          });
          // Back up connection credentials immediately
          await this.saveSessionToDb(tenantId);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.logger.log(`WhatsApp session closed for tenant ${tenantId}. Reconnecting: ${shouldReconnect}`);

          this.sessions.delete(tenantId);

          if (shouldReconnect) {
            this.initSession(tenantId).catch(err => {
              this.logger.error(`Failed to reconnect session for tenant ${tenantId}: ${err.message}`);
            });
          } else {
            this.logger.log(`Tenant ${tenantId} logged out or session invalidated.`);
            await this.prisma.whatsAppSession.update({
              where: { tenantId },
              data: { isConnected: false, qrCode: null, sessionData: null },
            });
            try {
              fs.rmSync(authDir, { recursive: true, force: true });
            } catch { }
          }
        }
      });
    } catch (error: any) {
      this.logger.error(`[initSession] Exception caught during WhatsApp initialization for tenant ${tenantId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async closeSession(tenantId: string): Promise<void> {
    const sock = this.sessions.get(tenantId);
    if (sock) {
      try {
        sock.end(undefined);
      } catch { }
      this.sessions.delete(tenantId);
    }

    const authDir = path.join(process.cwd(), 'storage', 'whatsapp-auth', tenantId);
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch { }

    await this.prisma.whatsAppSession.update({
      where: { tenantId },
      data: { isConnected: false, qrCode: null, sessionData: null },
    });
  }

  async sendMessage(tenantId: string, to: string, text: string): Promise<boolean> {
    const sock = this.sessions.get(tenantId);
    if (!sock) {
      this.logger.warn(`No active WhatsApp session socket found for tenant: ${tenantId}`);
      return false;
    }

    try {
      let formattedTo = to.replace(/\D/g, '');
      if (!formattedTo.endsWith('@s.whatsapp.net')) {
        formattedTo = `${formattedTo}@s.whatsapp.net`;
      }

      // --- Safety Measure 1: Stealth Composing Presence State ---
      try {
        await sock.sendPresenceUpdate('composing', formattedTo);
      } catch (presenceErr) {
        this.logger.debug(`Could not send presence update: ${presenceErr.message}`);
      }

      // --- Safety Measure 2: Randomized Jitter Delay (2-4 seconds) ---
      const delayMs = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      try {
        await sock.sendPresenceUpdate('paused', formattedTo);
      } catch { }

      // --- Safety Measure 3: Zero-Width Suffix for Unique Message Signature ---
      const zwsp = '\u200B'.repeat(Math.floor(Math.random() * 5) + 1);
      const uniqueText = `${text}${zwsp}`;

      await sock.sendMessage(formattedTo, { text: uniqueText });
      this.logger.log(`WhatsApp message sent successfully to ${formattedTo} for tenant ${tenantId} (delayed ${delayMs}ms)`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message: ${err.message}`, err.stack);
      return false;
    }
  }

  private async isOutsideOfficeHours(tenantId: string): Promise<boolean> {
    const now = new Date();
    const dayOfWeek = now.getDay();

    const outlet = await this.prisma.outlet.findFirst({
      where: { tenantId },
      include: { timings: true },
    });

    if (!outlet || !outlet.timings || outlet.timings.length === 0) {
      const hour = now.getHours();
      return hour < 9 || hour >= 21;
    }

    const todayTiming = outlet.timings.find(t => t.dayOfWeek === dayOfWeek);
    if (!todayTiming || todayTiming.isClosed) {
      return true;
    }

    const [openH, openM] = todayTiming.openTime.split(':').map(Number);
    const [closeH, closeM] = todayTiming.closeTime.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes < openMinutes || currentMinutes >= closeMinutes;
  }
}
