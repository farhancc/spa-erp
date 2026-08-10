import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    data: {
      tenantId: string;
      userId?: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      entityName: 'Invoice' | 'Payment' | 'LoyaltyTransaction' | 'CouponUsage';
      entityId: string;
      oldValues?: any;
      newValues?: any;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: any,
  ) {
    const client = tx || this.prisma;
    return client.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entityName: data.entityName,
        entityId: data.entityId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
