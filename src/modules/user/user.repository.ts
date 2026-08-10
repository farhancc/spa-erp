import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  protected readonly model = 'user';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & { search?: string; role?: string; outletId?: string } = {},
  ): Promise<PaginatedResult<User>> {
    const { search, role, outletId, ...pagination } = options;

    const where: any = { tenantId, deletedAt: null };

    if (role) {
      where.role = role;
    }

    // For outlet-scoped staff, show staff assigned to this outlet OR staff with no outlet (global)
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        { OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ]},
      ];
    }

    const pageVal = Number(pagination.page ?? 1);
    const limitVal = Number(pagination.limit ?? 20);
    const page = isNaN(pageVal) ? 1 : Math.max(1, pageVal);
    const limit = isNaN(limitVal) ? 20 : Math.min(100, limitVal);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { staffProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data as any,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, email, deletedAt: null },
    });
  }

  async findAllByTenant(tenantId: string, outletId?: string): Promise<User[]> {
    const where: any = { tenantId, deletedAt: null };
    // Show staff assigned to this outlet OR global staff (no outlet assignment)
    if (outletId) {
      where.OR = [
        { outletId },
        { outletId: null },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { staffProfile: true },
    });
  }
}
