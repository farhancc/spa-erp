import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class CustomerRepository extends BaseRepository<Customer> {
  protected readonly model = 'customer';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  override async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { loyaltyAccount: true },
    });
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & { search?: string; outletId?: string } = {},
  ): Promise<PaginatedResult<Customer>> {
    const { search, outletId, ...pagination } = options;

    const where: any = {
      tenantId,
    };

    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }

    if (search) {
      const searchFilter = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchFilter }
        ];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const pageVal = Number(pagination.page ?? 1);
    const limitVal = Number(pagination.limit ?? 20);
    const page = isNaN(pageVal) ? 1 : Math.max(1, pageVal);
    const limit = isNaN(limitVal) ? 20 : Math.min(100, limitVal);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: { loyaltyAccount: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByPhone(tenantId: string, phone: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: { tenantId, phone },
      include: { loyaltyAccount: true },
    });
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: { tenantId, email },
      include: { loyaltyAccount: true },
    });
  }

  async findAllByTenant(tenantId: string, outletId?: string): Promise<Customer[]> {
    const where: any = { tenantId };
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      include: { loyaltyAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByReferralCode(tenantId: string, referralCode: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: { tenantId, referralCode },
    });
  }
}
