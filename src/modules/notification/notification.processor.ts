import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '../../core/database/prisma.service';
import { QUEUE_NAMES } from '../../core/queues/queue-names.const';
import * as sgMail from '@sendgrid/mail';
import twilio from 'twilio';

@Processor(QUEUE_NAMES.NOTIFICATION)
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { name, data } = job;
    this.logger.log(`Processing Notification job: ${name} (id=${job.id})`);

    const { tenantId, customerId, to, subject, body, templateKey, metadata } = data;

    if (!tenantId) {
      this.logger.warn(`No tenantId provided for notification job ${name}. Skipping.`);
      return;
    }

    // Determine channel from job name
    let channel = 'SMS';
    let sendResult = true;

    if (name === 'send-whatsapp') {
      channel = 'WHATSAPP';
      // WhatsApp is processed by the dedicated WhatsappProcessor, but if we receive
      // a direct send-whatsapp job in NotificationProcessor we simulate success.
      sendResult = true;
    } else if (name === 'send-email') {
      channel = 'EMAIL';
      sendResult = await this.sendEmail(to, subject, body);
    } else if (name === 'send-sms') {
      channel = 'SMS';
      sendResult = await this.sendSms(to, body);
    }

    // Persist notification record
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        customerId: customerId || null,
        channel,
        status: sendResult ? 'SENT' : 'FAILED',
        to,
        subject: subject || null,
        body: body || '',
        templateKey: templateKey || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sentAt: sendResult ? new Date() : null,
      },
    });

    this.logger.log(
      `[Notification Dispatcher] Channel: ${channel} | To: ${to} | Record ID: ${notification.id} | Status: ${notification.status}`,
    );
    return { success: sendResult, notificationId: notification.id };
  }

  private async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const apiKey = this.config.get<string>('app.sendgrid.apiKey');
    const fromEmail = this.config.get<string>('app.sendgrid.fromEmail');

    if (!apiKey) {
      this.logger.warn(`[SendGrid Simulator] Email key not set. Simulating mail send: To=${to}, Subject="${subject}"`);
      return true;
    }

    try {
      sgMail.setApiKey(apiKey);
      await sgMail.send({
        to,
        from: fromEmail || 'noreply@careva.in',
        subject: subject || 'Careva Notification',
        text: body,
        html: body,
      });
      this.logger.log(`[SendGrid Dispatcher] Successfully sent email to ${to}`);
      return true;
    } catch (e: any) {
      this.logger.error(`[SendGrid Dispatcher] Failed to send email to ${to}: ${e.message}`, e.stack);
      return false;
    }
  }

  private async sendSms(to: string, body: string): Promise<boolean> {
    const accountSid = this.config.get<string>('app.twilio.accountSid');
    const authToken = this.config.get<string>('app.twilio.authToken');
    const fromNumber = this.config.get<string>('app.twilio.fromNumber');

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn(`[Twilio Simulator] Credentials not set. Simulating SMS send: To=${to}, Msg="${body}"`);
      return true;
    }

    try {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        body,
        from: fromNumber,
        to,
      });
      this.logger.log(`[Twilio Dispatcher] Successfully sent SMS to ${to}`);
      return true;
    } catch (e: any) {
      this.logger.error(`[Twilio Dispatcher] Failed to send SMS to ${to}: ${e.message}`, e.stack);
      return false;
    }
  }
}
