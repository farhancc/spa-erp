import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../core/database/prisma.service';
import { QUEUE_NAMES } from '../../core/queues/queue-names.const';
import { WhatsappSessionManager } from './whatsapp-session.manager';

@Processor(QUEUE_NAMES.WHATSAPP)
@Injectable()
export class WhatsappProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionManager: WhatsappSessionManager,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { name, data } = job;
    this.logger.log(`Processing WhatsApp job: ${name} (id=${job.id})`);

    const { tenantId, to, body, customerName, bookingId, scheduledAt } = data;

    if (!tenantId) {
      this.logger.warn(`No tenantId provided for job ${name}. Skipping.`);
      return;
    }

    // Guard: check if booking is still active/confirmed before sending reminders
    if (name === 'send-reminder' && bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true },
      });
      if (!booking || booking.status !== 'CONFIRMED') {
        this.logger.log(`Skipping reminder for booking ${bookingId} because status is ${booking?.status || 'DELETED'}`);
        return { success: false, reason: `Booking is ${booking?.status || 'DELETED'}` };
      }
    }

    // Build message body based on job type
    let messageBody = body || '';
    if (name === 'send-booking-confirmation') {
      messageBody = `Hi ${customerName || 'Valued Customer'}, your booking is confirmed for ${scheduledAt ? new Date(scheduledAt).toLocaleString() : 'your scheduled time'}. Booking ID: ${bookingId || 'N/A'}.`;
    } else if (name === 'send-reminder') {
      const timeLabel = data.timeLabel || 'upcoming';
      messageBody = `Hi ${customerName || 'Valued Customer'}, this is a reminder that your appointment is in ${timeLabel} (scheduled for ${scheduledAt ? new Date(scheduledAt).toLocaleString() : 'your scheduled time'}).`;
    } else if (name === 'send-birthday-offer') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, birthdayWishTemplate: true, birthdayCouponCode: true },
      });
      const template = tenant?.birthdayWishTemplate || "Happy Birthday {{name}}! 🎉 Here is a special treat: Use code {{coupon}} to get 20% off your next visit!";
      const coupon = tenant?.birthdayCouponCode || "BDAY20";
      
      messageBody = template
        .replace(/\{\{name\}\}/gi, customerName || 'Valued Customer')
        .replace(/\{\{coupon\}\}/gi, coupon)
        .replace(/\{\{brand\}\}/gi, tenant?.name || 'our salon');
    } else if (name === 'send-otp') {
      messageBody = `Your verification code is ${data.code}. Valid for 5 minutes.`;
    }

    // Find customer by phone in this tenant
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: to },
    });

    // Create or find default WhatsApp session for this tenant
    let session = await this.prisma.whatsAppSession.findUnique({
      where: { tenantId },
    });
    if (!session) {
      session = await this.prisma.whatsAppSession.create({
        data: {
          tenantId,
          isConnected: true,
          phoneNumber: '9999999999',
        },
      });
    }

    // Persist outbound message record
    const message = await this.prisma.whatsAppMessage.create({
      data: {
        tenantId,
        sessionId: session.id,
        customerId: customer?.id || null,
        direction: 'OUTBOUND',
        to,
        from: session.phoneNumber || 'SYSTEM',
        body: messageBody,
        messageId: `msg_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
        isRead: false,
        sentAt: new Date(),
      },
    });

    // Try sending based on connectionType
    let sendStatus = 'Simulated (Sandbox)';

    if (session && session.connectionType === 'OFFICIAL') {
      const token = session.metaAccessToken || process.env.WHATSAPP_CLOUD_API_TOKEN;
      const phoneNumberId = session.metaPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (token && phoneNumberId) {
        const apiSent = await this.sendViaMetaCloudApi(to, messageBody, token, phoneNumberId);
        if (apiSent) {
          sendStatus = 'Sent (Cloud API)';
        }
      } else {
        this.logger.warn(`Tenant ${tenantId} set to OFFICIAL WhatsApp but missing Meta credentials`);
      }
    } else {
      // Unofficial (Baileys) connection type
      const msgSent = await this.sessionManager.sendMessage(tenantId, to, messageBody);
      if (msgSent) {
        sendStatus = 'Sent (Baileys)';
      }
    }

    this.logger.log(
      `[WhatsApp Dispatcher] To: ${to} | Msg: "${messageBody.slice(0, 60)}..." | Record ID: ${message.id} | Send Status: ${sendStatus}`,
    );
    return { success: true, messageId: message.id };
  }

  private async sendViaMetaCloudApi(to: string, messageBody: string, token?: string, phoneNumberId?: string): Promise<boolean> {
    const apiToken = token || process.env.WHATSAPP_CLOUD_API_TOKEN;
    const apiPhoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !apiPhoneId) {
      this.logger.debug('Meta Cloud API credentials not configured. Running in simulated sandbox mode.');
      return false;
    }

    try {
      // Clean phone number (remove non-digits, e.g. +91 99000 88000 -> 919900088000)
      const cleanPhone = to.replace(/\D/g, '');

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${apiPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: messageBody,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Meta Cloud API responded with status ${response.status}: ${errText}`);
        return false;
      }

      this.logger.log(`Successfully dispatched WhatsApp message to ${cleanPhone} via Meta Cloud API.`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to dispatch WhatsApp message via Meta Cloud API: ${error.message}`, error.stack);
      return false;
    }
  }
}
