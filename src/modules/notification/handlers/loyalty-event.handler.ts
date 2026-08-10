import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import { InvoicePaidEvent } from '../../../core/events/domain-events';
import { LoyaltyRepository } from '../../loyalty/loyalty.repository';

import { AuditLogService } from '../../audit-log/audit-log.service';

/**
 * LoyaltyEventHandler
 *
 * Listens to InvoicePaidEvent and automatically:
 * 1. Creates / retrieves the customer's loyalty account
 * 2. Records an EARN transaction for the points
 * 3. Updates the running balance on the account
 *
 * This is the ONLY place loyalty points are credited — ensuring
 * a single source of truth and keeping POS decoupled from Loyalty.
 */
@Injectable()
export class LoyaltyEventHandler {
  private readonly logger = new Logger(LoyaltyEventHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyRepo: LoyaltyRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  @OnEvent(InvoicePaidEvent.EVENT)
  async handleInvoicePaid(event: InvoicePaidEvent) {
    if (event.loyaltyPointsEarned <= 0) return;

    try {
      const { tenantId, customerId, loyaltyPointsEarned, invoiceId } = event;

      // 1. Ensure loyalty program exists for this tenant
      let program = await this.loyaltyRepo.findProgramByTenant(tenantId);
      if (!program) {
        program = await this.loyaltyRepo.createProgram(tenantId, 'Loyalty Points');
      }

      // 2. Ensure customer has an account
      let account = await this.loyaltyRepo.findAccount(tenantId, customerId);
      if (!account) {
        account = await this.loyaltyRepo.createAccount(tenantId, customerId, program.id);
      }

      // 3. Credit points
      const lt = await this.prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          tenantId,
          type: 'EARN',
          points: loyaltyPointsEarned,
          invoiceId,
          description: `Earned ${loyaltyPointsEarned} points on invoice ${invoiceId}`,
        },
      });

      // Audit log loyalty transaction
      await this.auditLog.record({
        tenantId,
        action: 'CREATE',
        entityName: 'LoyaltyTransaction',
        entityId: lt.id,
        newValues: lt,
      });

      await this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          totalPoints: { increment: loyaltyPointsEarned },
          lifetimeEarned: { increment: loyaltyPointsEarned },
        },
      });

      this.logger.log(
        `Credited ${loyaltyPointsEarned} loyalty points to customer ${customerId} (tenant: ${tenantId})`,
      );
    } catch (err) {
      this.logger.error(`Failed to credit loyalty points: ${err.message}`, err.stack);
    }
  }
}
