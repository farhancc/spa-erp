import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { InjectQueue } from '@nestjs/bullmq';
import { WhatsAppMessage, WhatsAppSession } from '@prisma/client';
import { WhatsappSessionManager } from './whatsapp-session.manager';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
    @InjectQueue('whatsapp-queue') private readonly whatsappQueue: any,
    private readonly sessionManager: WhatsappSessionManager,
  ) {}

  async getSession(): Promise<WhatsAppSession> {
    const tenantId = this.tenantCtx.tenantId;

    let session = await this.prisma.whatsAppSession.findUnique({
      where: { tenantId },
    });

    if (!session) {
      session = await this.prisma.whatsAppSession.create({
        data: {
          tenantId,
          isConnected: false,
          phoneNumber: null,
          qrCode: null,
        },
      });
    }

    return session;
  }

  async connectSession(phoneNumber: string): Promise<WhatsAppSession> {
    // Baileys automatically transitions to connected state upon QR scan.
    // This endpoint acts as a verification fetch.
    return this.getSession();
  }

  async disconnectSession(): Promise<WhatsAppSession> {
    const tenantId = this.tenantCtx.tenantId;
    await this.sessionManager.closeSession(tenantId);
    return this.getSession();
  }

  async generateQrCode(): Promise<WhatsAppSession> {
    const tenantId = this.tenantCtx.tenantId;
    await this.getSession();

    // Trigger async initialization of Baileys socket to generate QR
    this.sessionManager.initSession(tenantId).catch(err => {
      console.error(`Error in generateQrCode during initSession for tenant ${tenantId}:`, err);
    });

    return this.getSession();
  }

  async getMessages(options: { page?: number; limit?: number } = {}): Promise<{ data: WhatsAppMessage[]; total: number }> {
    const tenantId = this.tenantCtx.tenantId;
    const page = Math.max(1, Number(options.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(options.limit ?? 20)));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where: { tenantId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: true,
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: { tenantId },
      }),
    ]);

    return { data: data as any, total };
  }

  async sendMessage(to: string, body: string, customerId?: string, tenantIdOverride?: string): Promise<any> {
    const tenantId = tenantIdOverride || this.tenantCtx.tenantId;

    // Enqueue message to whatsapp-queue
    const job = await this.whatsappQueue.add('send-message', {
      tenantId,
      to,
      body,
      customerId,
    });

    return {
      success: true,
      jobId: job.id,
      message: 'Message queued successfully',
    };
  }

  async triggerCampaign(dto: { type: string; recipientName: string; phone: string; variables: Record<string, string> }): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;

    // Resolve template and variables, then call sendMessage
    // Usually, we would format variables into the template text here
    const templateText = dto.variables.messageText || `Hi ${dto.recipientName}, thank you for choosing us!`;

    // Try finding customer id if phone exists
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: dto.phone },
    });

    return this.sendMessage(dto.phone, templateText, customer?.id);
  }

  async configureSession(dto: { connectionType: string; metaAccessToken?: string; metaPhoneNumberId?: string; metaBusinessAccountId?: string; metaVerifyToken?: string }): Promise<WhatsAppSession> {
    const tenantId = this.tenantCtx.tenantId;
    await this.getSession(); // ensures session exists

    return this.prisma.whatsAppSession.update({
      where: { tenantId },
      data: {
        connectionType: dto.connectionType,
        metaAccessToken: dto.metaAccessToken ?? null,
        metaPhoneNumberId: dto.metaPhoneNumberId ?? null,
        metaBusinessAccountId: dto.metaBusinessAccountId ?? null,
        metaVerifyToken: dto.metaVerifyToken ?? null,
      },
    });
  }

  async getRules(): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.whatsAppAutoReplyRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveRule(dto: { id?: string; triggerType: string; keywords?: string; replyText: string; isActive?: boolean }): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;

    if (dto.id) {
      return this.prisma.whatsAppAutoReplyRule.update({
        where: { id: dto.id },
        data: {
          triggerType: dto.triggerType,
          keywords: dto.keywords ?? null,
          replyText: dto.replyText,
          isActive: dto.isActive ?? true,
        },
      });
    }

    return this.prisma.whatsAppAutoReplyRule.create({
      data: {
        tenantId,
        triggerType: dto.triggerType,
        keywords: dto.keywords ?? null,
        replyText: dto.replyText,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async deleteRule(id: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    // ensure rule belongs to tenant
    const rule = await this.prisma.whatsAppAutoReplyRule.findFirst({
      where: { id, tenantId },
    });

    if (!rule) {
      throw new NotFoundException('Auto reply rule not found');
    }

    await this.prisma.whatsAppAutoReplyRule.delete({
      where: { id },
    });

    return { success: true };
  }

  async isOutsideOfficeHours(tenantId: string): Promise<boolean> {
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

  async getBirthdaySettings(): Promise<{ birthdayWishTemplate: string | null; birthdayCouponCode: string | null }> {
    const tenantId = this.tenantCtx.tenantId;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { birthdayWishTemplate: true, birthdayCouponCode: true },
    });
    return {
      birthdayWishTemplate: tenant?.birthdayWishTemplate ?? null,
      birthdayCouponCode: tenant?.birthdayCouponCode ?? null,
    };
  }

  async updateBirthdaySettings(dto: { birthdayWishTemplate: string; birthdayCouponCode: string }): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        birthdayWishTemplate: dto.birthdayWishTemplate,
        birthdayCouponCode: dto.birthdayCouponCode,
      },
    });
    return { success: true };
  }
}
