import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class LoyaltyRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findProgramByTenant(tenantId: string) {
    return this.prisma.loyaltyProgram.findUnique({
      where: { tenantId },
    });
  }

  async createProgram(tenantId: string, name: string) {
    return this.prisma.loyaltyProgram.create({
      data: {
        tenantId,
        name,
        pointsPerRupee: 1.0,
        rupeePerPoint: 0.5,
        minRedeemPoints: 100,
        maxRedeemPct: 0.2,
        isActive: true,
      },
    });
  }

  async updateProgram(id: string, data: any) {
    return this.prisma.loyaltyProgram.update({
      where: { id },
      data: {
        name: data.name,
        pointsPerRupee: data.pointsPerRupee !== undefined ? parseFloat(data.pointsPerRupee) : undefined,
        rupeePerPoint: data.rupeePerPoint !== undefined ? parseFloat(data.rupeePerPoint) : undefined,
        minRedeemPoints: data.minRedeemPoints !== undefined ? parseInt(data.minRedeemPoints) : undefined,
        maxRedeemPct: data.maxRedeemPct !== undefined ? parseFloat(data.maxRedeemPct) : undefined,
        signupPoints: data.signupPoints !== undefined ? parseInt(data.signupPoints) : undefined,
        bookingPoints: data.bookingPoints !== undefined ? parseInt(data.bookingPoints) : undefined,
        isActive: data.isActive,
      },
    });
  }

  async findAccount(tenantId: string, customerId: string) {
    return this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
    });
  }

  async createAccount(tenantId: string, customerId: string, programId: string) {
    return this.prisma.loyaltyAccount.create({
      data: {
        tenantId,
        customerId,
        programId,
        totalPoints: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
      },
    });
  }

  async adjustPoints(
    accountId: string,
    points: number,
    type: 'EARN' | 'REDEEM' | 'ADJUST',
    description?: string,
  ) {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new Error('Loyalty account not found');

    const totalPoints = Math.max(0, account.totalPoints + points);
    const lifetimeEarned = points > 0 ? account.lifetimeEarned + points : account.lifetimeEarned;
    const lifetimeRedeemed = points < 0 ? account.lifetimeRedeemed + Math.abs(points) : account.lifetimeRedeemed;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create transaction log record
      const lt = await tx.loyaltyTransaction.create({
        data: {
          accountId,
          tenantId: account.tenantId,
          type,
          points,
          description: description || `Points adjusted by ${type.toLowerCase()}`,
        },
      });

      // Audit log loyalty transaction creation
      await this.auditLog.record({
        tenantId: account.tenantId,
        action: 'CREATE',
        entityName: 'LoyaltyTransaction',
        entityId: lt.id,
        newValues: lt,
      }, tx);

      // 2. Update account totals
      return tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          totalPoints,
          lifetimeEarned,
          lifetimeRedeemed,
        },
      });
    });
  }
}
