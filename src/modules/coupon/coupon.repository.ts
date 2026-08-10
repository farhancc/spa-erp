import { Injectable } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class CouponRepository extends BaseRepository<Coupon> {
  protected readonly model = 'coupon';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & { search?: string; outletId?: string } = {},
  ): Promise<PaginatedResult<Coupon>> {
    const { search, outletId, ...pagination } = options;

    const where: any = {
      tenantId,
    };

    if (outletId) {
      where.OR = [
        { outletId: null },
        { outletId },
      ];
    }

    if (search) {
      where.code = { contains: search };
    }

    return this.findAll(where, pagination);
  }

  async findByCode(tenantId: string, code: string): Promise<Coupon | null> {
    return this.prisma.coupon.findFirst({
      where: { tenantId, code },
    });
  }

  async findAllByTenant(tenantId: string, outletId?: string): Promise<Coupon[]> {
    const where: any = { tenantId };
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }
    return this.prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
