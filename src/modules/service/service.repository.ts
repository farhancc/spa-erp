import { Injectable } from '@nestjs/common';
import { Service } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class ServiceRepository extends BaseRepository<Service> {
  protected readonly model = 'service';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & { search?: string; categoryId?: string; outletId?: string } = {},
  ): Promise<PaginatedResult<Service>> {
    const { search, categoryId, outletId, ...pagination } = options;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }

    if (search) {
      where.name = { contains: search };
    }

    return this.findAll(where, pagination);
  }

  async findByTenantAll(tenantId: string, outletId?: string): Promise<Service[]> {
    const where: any = { tenantId, deletedAt: null };
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }
    return this.prisma.service.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByIdWithCategory(id: string): Promise<any | null> {
    return this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
  }
}
