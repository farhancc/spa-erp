import { Injectable } from '@nestjs/common';
import { Invoice } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class PosRepository extends BaseRepository<Invoice> {
  protected readonly model = 'invoice';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & {
      search?: string;
      customerId?: string;
      status?: string;
      outletId?: string;
      from?: Date | string;
      to?: Date | string;
    } = {},
  ): Promise<PaginatedResult<Invoice>> {
    const { search, customerId, status, page = 1, limit = 20, outletId, from, to } = options;

    const where: any = {
      tenantId,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (outletId) {
      where.outletId = outletId;
    }

    if (from || to) {
      where.createdAt = {
        ...(from && { gte: typeof from === 'string' ? new Date(from) : from }),
        ...(to && { lte: typeof to === 'string' ? new Date(to) : to }),
      };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    const currentPage = Math.max(1, page);
    const currentLimit = Math.min(100, limit);
    const skip = (currentPage - 1) * currentLimit;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: currentLimit,
        include: {
          customer: true,
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  async findByIdWithDetails(id: string): Promise<any | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });
  }

  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        tenantId,
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }
}
