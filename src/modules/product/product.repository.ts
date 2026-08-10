import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  protected readonly model = 'product';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & { search?: string; outletId?: string } = {},
  ): Promise<PaginatedResult<Product>> {
    const { search, outletId, ...pagination } = options;

    const where: any = { tenantId, deletedAt: null };

    // Products can be outlet-specific or global (null outletId means available to all outlets)
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        { OR: [{ name: { contains: search } }, { sku: { contains: search } }] },
      ];
    }

    return this.findAll(where, pagination);
  }

  async findBySku(tenantId: string, sku: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { tenantId, sku, deletedAt: null },
    });
  }

  async findAllByTenant(tenantId: string, outletId?: string): Promise<Product[]> {
    const where: any = { tenantId, deletedAt: null };
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }
    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
