import { Injectable } from '@nestjs/common';
import { Booking } from '@prisma/client';
import { BookingStatus } from '../../shared/types/enums';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class BookingRepository extends BaseRepository<Booking> {
  protected readonly model = 'booking';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // ─── Tenant-scoped queries ──────────────────────────────────────────────────

  async findByTenant(
    tenantId: string,
    options: PaginationOptions & {
      outletId?: string;
      staffId?: string;
      customerId?: string;
      status?: BookingStatus;
      from?: Date | string;
      to?: Date | string;
      search?: string;
    } = {},
  ): Promise<PaginatedResult<Booking>> {
    const { outletId, staffId, customerId, status, from, to, search, ...pagination } = options;
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.min(100, pagination.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(outletId && { outletId }),
      ...(staffId && { staffId }),
      ...(customerId && { customerId }),
      ...(status && { status }),
      ...(from || to
        ? {
            scheduledAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { staff: { name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: { service: true },
          },
          customer: true,
          staff: true,
          outlet: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.delegate.count({ where }),
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

  async findUpcomingForCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<Booking[]> {
    return this.delegate.findMany({
      where: {
        tenantId,
        customerId,
        scheduledAt: { gte: new Date() },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      include: { items: { include: { service: true } }, staff: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findRemindersToSend(): Promise<Booking[]> {
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in23Hours = new Date(Date.now() + 23 * 60 * 60 * 1000);

    return this.delegate.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        reminderSentAt: null,
        scheduledAt: { gte: in23Hours, lte: in24Hours },
      },
      include: { customer: true, outlet: true },
    });
  }

  async findStaffSlots(
    outletId: string,
    staffId: string,
    date: Date,
  ): Promise<Booking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.delegate.findMany({
      where: {
        outletId,
        staffId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
