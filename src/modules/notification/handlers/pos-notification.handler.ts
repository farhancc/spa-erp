import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InvoicePaidEvent } from '../../../core/events/domain-events';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../../../core/queues/queue-names.const';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class PosNotificationHandler {
  private readonly logger = new Logger(PosNotificationHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(InvoicePaidEvent.EVENT)
  async handleInvoicePaid(event: InvoicePaidEvent) {
    try {
      this.logger.log(`Received invoice.paid event for invoice ID: ${event.invoiceId}`);

      // 1. Fetch complete invoice with details
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: event.invoiceId },
        include: {
          items: true,
          customer: true,
          outlet: true,
          payments: true,
        },
      });

      if (!invoice) {
        this.logger.warn(`Invoice with ID ${event.invoiceId} not found in database. Skipping email.`);
        return;
      }

      const customer = invoice.customer;
      if (!customer) {
        this.logger.warn(`No customer linked to invoice ${invoice.invoiceNumber}. Skipping email.`);
        return;
      }

      if (!customer.email) {
        this.logger.log(`Customer ${customer.name} does not have an email address configured. Skipping email.`);
        return;
      }

      this.logger.log(`Preparing invoice email receipt for customer: ${customer.email}`);

      // 2. Format a premium email body
      const dateStr = invoice.createdAt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const itemRows = invoice.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: left; color: #4B5563;">
            <div style="font-weight: 600; color: #1F2937;">${item.name}</div>
            <div style="font-size: 11px; color: #9CA3AF;">Qty: ${item.quantity} × ₹${item.unitPrice}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600; color: #1F2937;">
            ₹${item.total}
          </td>
        </tr>
      `,
        )
        .join('');

      const emailSubject = `Your Invoice Receipt from ${invoice.outlet?.name || 'Careva'} [${invoice.invoiceNumber}]`;

      const emailHtmlBody = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 24px;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #E7E5E4; padding-bottom: 24px; margin-bottom: 24px;">
            <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.05em; color: #1C1917; margin: 0; text-transform: uppercase;">${invoice.outlet?.name || 'CAREVA'}</h1>
            <p style="font-size: 12px; color: #78716C; margin: 6px 0 0 0;">${invoice.outlet?.address || ''}, ${invoice.outlet?.city || ''}</p>
          </div>

          <!-- Invoice Metadata -->
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #57534E; margin-bottom: 30px;">
            <div>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E; display: block; margin-bottom: 4px;">Invoice Number</span>
              <strong>${invoice.invoiceNumber}</strong>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E; display: block; margin-bottom: 4px;">Date Issued</span>
              <strong>${dateStr}</strong>
            </div>
          </div>

          <!-- Billed To -->
          <div style="background-color: #FFFFFF; border: 1px solid #E7E5E4; padding: 16px; border-radius: 16px; margin-bottom: 30px; font-size: 13px;">
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E; display: block; margin-bottom: 6px;">Billed To</span>
            <strong style="color: #1C1917; display: block; font-size: 15px; margin-bottom: 4px;">${customer.name}</strong>
            <span style="color: #78716C; display: block;">${customer.phone}</span>
            <span style="color: #78716C; display: block;">${customer.email}</span>
          </div>

          <!-- Itemized Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
            <thead>
              <tr>
                <th style="padding-bottom: 12px; border-bottom: 2px solid #E7E5E4; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E;">Item Description</th>
                <th style="padding-bottom: 12px; border-bottom: 2px solid #E7E5E4; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="width: 100%; font-size: 13px; color: #57534E; border-top: 1px solid #E7E5E4; padding-top: 16px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Subtotal:</span>
              <span style="color: #1C1917; font-weight: 600;">₹${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            ${Number(invoice.discountAmount) > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #15803D;">
              <span>Discount Applied:</span>
              <span style="font-weight: 600;">-₹${Number(invoice.discountAmount).toFixed(2)}</span>
            </div>
            ` : ''}
            ${Number(invoice.loyaltyDiscount) > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #15803D;">
              <span>Loyalty Points Redeemed:</span>
              <span style="font-weight: 600;">-₹${Number(invoice.loyaltyDiscount).toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span>GST (18% inclusive):</span>
              <span style="color: #1C1917; font-weight: 600;">₹${Number(invoice.gstAmount).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #E7E5E4; padding-top: 16px; font-size: 16px; color: #1C1917;">
              <strong>Net Paid Total:</strong>
              <strong style="font-size: 20px;">₹${Number(invoice.totalAmount).toFixed(2)}</strong>
            </div>
          </div>

          <!-- Footer Note -->
          <div style="text-align: center; font-size: 11px; color: #A8A29E; border-top: 1px solid #E7E5E4; padding-top: 20px;">
            <p style="margin: 0 0 6px 0;">Paid via <strong>${invoice.payments?.[0]?.method || 'POS Gateway'}</strong></p>
            <p style="margin: 0;">Thank you for your visit! We look forward to serving you again.</p>
          </div>
        </div>
      `;

      // 3. Queue the email job
      await this.notificationQueue.add(
        NOTIFICATION_JOBS.SEND_EMAIL,
        {
          tenantId: event.tenantId,
          customerId: event.customerId,
          to: customer.email,
          subject: emailSubject,
          body: emailHtmlBody,
        },
        {
          priority: 2,
        },
      );

      this.logger.log(`Invoice email job queued successfully for invoice: ${invoice.invoiceNumber}`);
    } catch (err) {
      this.logger.error(`Failed to handle invoice email sending: ${err.message}`, err.stack);
    }
  }
}
