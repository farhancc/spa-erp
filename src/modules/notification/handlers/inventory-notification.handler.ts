import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProductOutOfStockEvent } from '../../../core/events/domain-events';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../../../core/queues/queue-names.const';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class InventoryNotificationHandler {
  private readonly logger = new Logger(InventoryNotificationHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(ProductOutOfStockEvent.EVENT)
  async handleProductOutOfStock(event: ProductOutOfStockEvent) {
    try {
      this.logger.log(`Received inventory.product.outofstock event for product ID: ${event.productId}`);

      // 1. Fetch Tenant and Outlet information
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: event.tenantId },
        select: { name: true, email: true },
      });

      if (!tenant) {
        this.logger.warn(`Tenant with ID ${event.tenantId} not found in database. Skipping notification.`);
        return;
      }

      let outletName = 'All Outlets';
      if (event.outletId) {
        const outlet = await this.prisma.outlet.findUnique({
          where: { id: event.outletId },
          select: { name: true },
        });
        if (outlet) {
          outletName = outlet.name;
        }
      }

      // 2. Resolve recipient emails (Tenant email + active Owners/Managers)
      const admins = await this.prisma.user.findMany({
        where: {
          tenantId: event.tenantId,
          role: { in: ['OWNER', 'MANAGER'] },
          isActive: true,
          email: { not: null },
        },
        select: { email: true, name: true },
      });

      const recipients = new Set<string>();
      if (tenant.email) {
        recipients.add(tenant.email.trim().toLowerCase());
      }
      for (const admin of admins) {
        if (admin.email) {
          recipients.add(admin.email.trim().toLowerCase());
        }
      }

      if (recipients.size === 0) {
        this.logger.warn(`No email recipients found for out-of-stock warning on tenant ${event.tenantId}. Skipping.`);
        return;
      }

      // 3. Prepare premium styled alert email body
      const emailSubject = `⚠️ Inventory Alert: Product Out of Stock [${event.productName}]`;

      const emailHtmlBody = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 24px;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #E7E5E4; padding-bottom: 24px; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 50%; padding: 12px; margin-bottom: 12px;">
              <span style="font-size: 24px; line-height: 1;">⚠️</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.05em; color: #7F1D1D; margin: 0; text-transform: uppercase;">Stock Depleted</h1>
            <p style="font-size: 12px; color: #78716C; margin: 6px 0 0 0;">${tenant.name} &bull; ${outletName}</p>
          </div>

          <!-- Alert Context -->
          <p style="font-size: 14px; color: #44403C; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            This is an automated alert to notify you that the following retail product has run out of stock and requires immediate replenishment.
          </p>

          <!-- Product Details Card -->
          <div style="background-color: #FFFFFF; border: 1px solid #E7E5E4; padding: 24px; border-radius: 16px; margin-bottom: 30px; font-size: 13px;">
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E; display: block; margin-bottom: 6px;">Product Name</span>
            <strong style="color: #1C1917; display: block; font-size: 16px; margin-bottom: 12px;">${event.productName}</strong>
            
            <table style="width: 100%; border-top: 1px solid #F5F5F4; padding-top: 12px; font-size: 13px;">
              <tr>
                <td style="width: 50%; padding: 6px 0;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E; display: block; margin-bottom: 4px;">SKU / Code</span>
                  <strong style="color: #44403C; font-family: monospace;">${event.sku || '—'}</strong>
                </td>
                <td style="width: 50%; padding: 6px 0;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A8A29E; display: block; margin-bottom: 4px;">Outlet Location</span>
                  <strong style="color: #44403C;">${outletName}</strong>
                </td>
              </tr>
            </table>
          </div>

          <!-- Restock Call to Action -->
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="font-size: 12px; color: #78716C; margin-bottom: 16px;">Please log in to the admin console to update your inventory quantities.</p>
            <a href="http://farhansalon.lvh.me:3000/tenant/farhansalon/admin?tab=PRODUCTS" style="display: inline-block; background-color: #1C1917; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.2s;">
              Open Products Dashboard
            </a>
          </div>

          <!-- Footer Note -->
          <div style="text-align: center; font-size: 11px; color: #A8A29E; border-top: 1px solid #E7E5E4; padding-top: 20px;">
            <p style="margin: 0;">Careva SaaS Inventory Control System</p>
          </div>
        </div>
      `;

      // 4. Queue the email jobs
      for (const email of recipients) {
        this.logger.log(`Queueing out-of-stock warning email for: ${email}`);
        await this.notificationQueue.add(
          NOTIFICATION_JOBS.SEND_EMAIL,
          {
            tenantId: event.tenantId,
            customerId: null,
            to: email,
            subject: emailSubject,
            body: emailHtmlBody,
          },
          {
            priority: 1, // High priority alert
          },
        );
      }

      this.logger.log(`Out-of-stock notification jobs queued successfully for product: ${event.productName}`);
    } catch (err) {
      this.logger.error(`Failed to handle out-of-stock email warning: ${err.message}`, err.stack);
    }
  }
}
