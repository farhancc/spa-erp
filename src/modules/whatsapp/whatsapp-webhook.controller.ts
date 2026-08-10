import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../core/database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Public } from '../../core/auth/public.decorator';

@ApiTags('WhatsApp Webhook')
@Controller('whatsapp/webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('whatsapp-queue') private readonly whatsappQueue: any,
  ) { }

  @Public()
  @ApiOperation({ summary: 'Verify Meta Cloud API Webhook subscription' })
  @Get()
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log(`Webhook verification request: mode=${mode}, token=${token}`);

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'careva_verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully via global verify token');
      return challenge;
    }

    // Fallback: search for tenant-specific verify token in WhatsAppSession
    const session = await this.prisma.whatsAppSession.findFirst({
      where: { metaVerifyToken: token },
    });

    if (session && mode === 'subscribe') {
      this.logger.log(`Webhook verified via tenant-specific token for tenant ${session.tenantId}`);
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    return 'Verification failed';
  }

  @Public()
  @ApiOperation({ summary: 'Receive Meta Cloud API message updates' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any) {
    this.logger.log(`Received Meta webhook payload`);

    if (body.object !== 'whatsapp_business_account') {
      return { status: 'ignored' };
    }

    try {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          if (!value) continue;

          const metadata = value.metadata;
          const messages = value.messages || [];

          if (messages.length === 0 || !metadata) continue;

          const phoneNumberId = metadata.phone_number_id;

          // Lookup tenant by metaPhoneNumberId
          const session = await this.prisma.whatsAppSession.findFirst({
            where: { metaPhoneNumberId: phoneNumberId },
          });

          if (!session) {
            this.logger.warn(`No tenant WhatsApp session found for Meta phoneNumberId: ${phoneNumberId}`);
            continue;
          }

          const tenantId = session.tenantId;

          for (const msg of messages) {
            if (msg.type !== 'text') continue;

            const fromPhone = msg.from;
            const bodyText = msg.text?.body || '';
            if (!bodyText) continue;

            this.logger.log(`Received Meta message from ${fromPhone} for tenant ${tenantId}: "${bodyText}"`);

            // 1. Persist inbound message to database
            const customer = await this.prisma.customer.findFirst({
              where: { tenantId, phone: fromPhone },
            });

            await this.prisma.whatsAppMessage.create({
              data: {
                tenantId,
                sessionId: session.id,
                customerId: customer?.id || null,
                direction: 'INBOUND',
                to: session.phoneNumber || metadata.display_phone_number || 'SYSTEM',
                from: fromPhone,
                body: bodyText,
                messageId: msg.id || `meta_${Date.now()}`,
                isRead: false,
                sentAt: new Date(),
              },
            });

            // 2. Match and trigger Auto Replies
            const rules = await this.prisma.whatsAppAutoReplyRule.findMany({
              where: { tenantId, isActive: true },
            });

            if (rules.length === 0) continue;

            let matchedRule: any = null;
            const cleanText = bodyText.toLowerCase().trim();

            // Keyword match
            matchedRule = rules.find(
              (r) =>
                r.triggerType === 'KEYWORD' &&
                r.keywords &&
                r.keywords
                  .split(',')
                  .some((kw) => cleanText.includes(kw.trim().toLowerCase())),
            );

            // Office Hours Outside match
            if (!matchedRule) {
              const outsideHours = await this.isOutsideOfficeHours(tenantId);
              if (outsideHours) {
                matchedRule = rules.find((r) => r.triggerType === 'OFFICE_HOURS_OUTSIDE');
              }
            }

            // Welcome match
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
                `Meta Auto-reply matched for tenant ${tenantId}: triggerType=${matchedRule.triggerType}, replying: "${matchedRule.replyText}"`,
              );

              // Queue response so it goes through Meta or Baileys depending on connectionType
              await this.whatsappQueue.add('send-message', {
                tenantId,
                to: fromPhone,
                body: matchedRule.replyText,
              });
            }
          }
        }
      }
    } catch (e) {
      this.logger.error(`Error processing webhook payload: ${e.message}`, e.stack);
    }

    return { status: 'success' };
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
