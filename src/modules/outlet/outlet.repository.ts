import { Injectable } from '@nestjs/common';
import { Outlet, OutletTiming } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class OutletRepository extends BaseRepository<Outlet> {
  protected readonly model = 'outlet';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & { activeOnly?: boolean } = {},
  ): Promise<PaginatedResult<Outlet>> {
    const { activeOnly, ...pagination } = options;
    return this.findAll(
      {
        tenantId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      pagination,
    );
  }

  async findBySlug(tenantId: string, slug: string): Promise<Outlet | null> {
    return this.delegate.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
  }

  async findWithTimings(tenantId: string, outletId: string): Promise<Outlet & { timings: OutletTiming[] }> {
    return this.delegate.findFirst({
      where: { id: outletId, tenantId },
      include: { timings: { orderBy: { dayOfWeek: 'asc' } } },
    });
  }

  async clearDefaultOutlet(tenantId: string): Promise<void> {
    await this.delegate.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // ─── Timings ─────────────────────────────────────────────────────────────────

  async upsertTiming(
    outletId: string,
    dayOfWeek: number,
    data: { openTime: string; closeTime: string; isClosed: boolean },
  ): Promise<OutletTiming> {
    return this.prisma.outletTiming.upsert({
      where: { outletId_dayOfWeek: { outletId, dayOfWeek } },
      update: data,
      create: { outletId, dayOfWeek, ...data },
    });
  }

  async getTimings(outletId: string): Promise<OutletTiming[]> {
    return this.prisma.outletTiming.findMany({
      where: { outletId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }
}
