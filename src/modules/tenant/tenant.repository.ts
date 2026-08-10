import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository } from '../../shared/base/base.repository';

@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {
  protected readonly model = 'tenant';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        outlets: true,
        users: true,
        coupons: true,
        website: {
          include: {
            pages: {
              include: {
                sections: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async findAllTenants(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      include: {
        outlets: true,
        users: true,
        coupons: true,
        website: {
          include: {
            pages: {
              include: {
                sections: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}


