import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingStatus } from '../../shared/types/enums';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { BookingRepository } from './booking.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import {
  BookingCreatedEvent,
  BookingCancelledEvent,
  BookingCompletedEvent,
} from '../../core/events/domain-events';
import { PaginationOptions, PaginatedResult } from '../../shared/base/base.repository';
import { Booking } from '@prisma/client';

/**
 * BookingService — All booking business logic lives here.
 *
 * Rules:
 * - Always scope queries to tenantId from TenantContextService
 * - Never call WhatsApp/Notification directly — emit domain events
 * - No direct Prisma calls — use BookingRepository
 */
@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBookingDto, createdByUserId: string): Promise<Booking> {
    const tenantId = this.tenantCtx.tenantId;

    // Validate outlet exists and belongs to tenant
    const outlet = await this.prisma.outlet.findFirst({
      where: { id: dto.outletId, tenantId },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');

    // Validate customer
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // Validate services and compute totals
    const services = await this.prisma.service.findMany({
      where: { id: { in: dto.items.map((i) => i.serviceId) }, tenantId },
    });
    if (services.length !== dto.items.length) {
      throw new BadRequestException('One or more services not found');
    }

    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
    let totalPrice = services.reduce((acc, s) => {
      const activePrice = s.offerPrice !== null && s.offerPrice !== undefined ? Number(s.offerPrice) : Number(s.price);
      return acc + activePrice;
    }, 0);
    if (dto.couponDiscount) {
      totalPrice = Math.max(0, totalPrice - Number(dto.couponDiscount));
    }
    const scheduledAt = new Date(dto.scheduledAt);
    const endsAt = new Date(scheduledAt.getTime() + totalDuration * 60000);

    const dayOfWeek = scheduledAt.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const timing = await this.prisma.outletTiming.findUnique({
      where: {
        outletId_dayOfWeek: {
          outletId: dto.outletId,
          dayOfWeek,
        },
      },
    });

    if (!timing || timing.isClosed) {
      throw new BadRequestException('Outlet is closed on this day');
    }

    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const getLocalMinutesSinceMidnight = (date: Date): number => {
      return date.getHours() * 60 + date.getMinutes();
    };

    const bookingStartMin = getLocalMinutesSinceMidnight(scheduledAt);
    const bookingEndMin = getLocalMinutesSinceMidnight(endsAt);
    const openMin = timeToMinutes(timing.openTime);
    const closeMin = timeToMinutes(timing.closeTime);

    if (bookingStartMin < openMin || bookingEndMin > closeMin) {
      throw new BadRequestException(
        `Booking must be within outlet operating hours (${timing.openTime} - ${timing.closeTime})`,
      );
    }

    // Create booking with items in a transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const startOfDay = new Date(scheduledAt);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(scheduledAt);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if outlet is blocked (holiday) on this date
      const blockedDate = await tx.outletBlockedDate.findFirst({
        where: {
          outletId: dto.outletId,
          tenantId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      if (blockedDate) {
        throw new BadRequestException(`Outlet is closed on this date: ${blockedDate.reason || 'Holiday'}`);
      }

      let currentItemStart = new Date(scheduledAt);
      const itemsToCreate: any[] = [];

      for (const item of dto.items) {
        const svc = services.find((s) => s.id === item.serviceId)!;
        const itemDuration = svc.duration;
        const itemEnd = new Date(currentItemStart.getTime() + itemDuration * 60000);
        const assignedStaffId = item.staffId ?? dto.staffId;

        if (assignedStaffId) {
          const staff = await tx.user.findFirst({
            where: { id: assignedStaffId, tenantId, deletedAt: null },
            include: { staffProfile: true },
          });

          if (!staff) {
            throw new NotFoundException(`Staff member not found for service ${svc.name}`);
          }

          if (staff.staffProfile) {
            const profile = staff.staffProfile;
            if (profile.workingDays && !profile.workingDays.includes(dayOfWeek)) {
              throw new BadRequestException(`Staff ${staff.name} is not working on this day`);
            }

            if (profile.breakStart && profile.breakEnd) {
              const breakStartMin = timeToMinutes(profile.breakStart);
              const breakEndMin = timeToMinutes(profile.breakEnd);
              const itemStartMin = getLocalMinutesSinceMidnight(currentItemStart);
              const itemEndMin = getLocalMinutesSinceMidnight(itemEnd);

              if (itemStartMin < breakEndMin && itemEndMin > breakStartMin) {
                throw new ConflictException(`Staff ${staff.name} is on break during the requested time`);
              }
            }
          }

          // Check if staff has approved leave on this date
          const hasLeave = await tx.staffLeave.findFirst({
            where: {
              staffId: assignedStaffId,
              tenantId,
              status: 'APPROVED',
              startDate: { lte: itemEnd },
              endDate: { gte: currentItemStart },
            },
          });
          if (hasLeave) {
            throw new ConflictException(`Staff ${staff.name} is on leave/off-duty during this period`);
          }

          // Check if staff has a blocked slot (lunch/break/personal)
          const blockedSlot = await tx.staffBlockSlot.findFirst({
            where: {
              staffId: assignedStaffId,
              tenantId,
              scheduledAt: { lt: itemEnd },
              endsAt: { gt: currentItemStart },
            },
          });
          if (blockedSlot) {
            throw new ConflictException(`Staff ${staff.name} is unavailable: ${blockedSlot.reason || 'Blocked Slot'}`);
          }

          // Check overlaps with other booking items for this staff member
          const conflictingItems = await tx.bookingItem.findMany({
            where: {
              staffId: assignedStaffId,
              booking: {
                outletId: dto.outletId,
                status: { notIn: [BookingStatus.CANCELLED] },
              },
              scheduledAt: { gte: startOfDay, lte: endOfDay },
            },
          });

          const hasItemConflict = conflictingItems.some(
            (bi) =>
              bi.scheduledAt && bi.endsAt &&
              currentItemStart < bi.endsAt &&
              itemEnd > bi.scheduledAt,
          );

          if (hasItemConflict) {
            throw new ConflictException(`Staff ${staff.name} is booked for another service during this slot`);
          }
        }

        const activePrice = svc.offerPrice !== null && svc.offerPrice !== undefined ? svc.offerPrice : svc.price;
        itemsToCreate.push({
          serviceId: item.serviceId,
          staffId: assignedStaffId,
          scheduledAt: new Date(currentItemStart),
          endsAt: new Date(itemEnd),
          duration: itemDuration,
          price: activePrice,
        });

        // Advance start time for next service to make them back-to-back
        currentItemStart = itemEnd;
      }

      const b = await tx.booking.create({
        data: {
          tenantId,
          outletId: dto.outletId,
          customerId: dto.customerId,
          staffId: dto.staffId,
          scheduledAt,
          endsAt,
          totalDuration,
          totalPrice,
          notes: dto.notes,
          status: BookingStatus.CONFIRMED,
          items: {
            create: itemsToCreate.map((it) => ({
              serviceId: it.serviceId,
              staffId: it.staffId,
              scheduledAt: it.scheduledAt,
              endsAt: it.endsAt,
              duration: it.duration,
              price: it.price,
            })),
          },
        },
        include: { items: true },
      });

      return b;
    });

    // Emit domain event — Notification module handles the WhatsApp confirmation
    this.eventEmitter.emit(
      BookingCreatedEvent.EVENT,
      new BookingCreatedEvent(
        tenantId,
        booking.id,
        dto.customerId,
        dto.outletId,
        scheduledAt,
        dto.staffId,
      ),
    );

    return booking;
  }

  async findAll(
    options: PaginationOptions & {
      outletId?: string;
      status?: BookingStatus;
      from?: Date | string;
      to?: Date | string;
    } = {},
  ): Promise<PaginatedResult<Booking>> {
    return this.bookingRepo.findByTenant(this.tenantCtx.tenantId, options);
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tenantId: this.tenantCtx.tenantId },
      include: {
        items: { include: { service: true } },
        customer: true,
        staff: true,
        outlet: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto): Promise<Booking> {
    const existing = await this.findOne(id); // validates tenancy
    const tenantId = this.tenantCtx.tenantId;

    return this.prisma.$transaction(async (tx) => {
      const outletId = dto.outletId ?? existing.outletId;
      const customerId = dto.customerId ?? existing.customerId;
      const staffId = dto.staffId !== undefined ? dto.staffId : existing.staffId;
      const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(existing.scheduledAt);
      
      const itemsDto = dto.items || (existing as any).items.map((i: any) => ({
        serviceId: i.serviceId,
        staffId: i.staffId || undefined,
      }));

      const services = await tx.service.findMany({
        where: { id: { in: itemsDto.map((i) => i.serviceId) }, tenantId },
      });
      if (services.length !== itemsDto.length) {
        throw new BadRequestException('One or more services not found');
      }

      const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
      let totalPrice = services.reduce((acc, s) => {
        const activePrice = s.offerPrice !== null && s.offerPrice !== undefined ? Number(s.offerPrice) : Number(s.price);
        return acc + activePrice;
      }, 0);
      if (dto.couponDiscount !== undefined) {
        totalPrice = Math.max(0, totalPrice - Number(dto.couponDiscount));
      } else if ((existing as any).couponDiscount) {
        totalPrice = Math.max(0, totalPrice - Number((existing as any).couponDiscount));
      }

      const endsAt = new Date(scheduledAt.getTime() + totalDuration * 60000);

      const dayOfWeek = scheduledAt.getDay();
      const timing = await tx.outletTiming.findUnique({
        where: { outletId_dayOfWeek: { outletId, dayOfWeek } },
      });
      if (!timing || timing.isClosed) {
        throw new BadRequestException('Outlet is closed on this day');
      }

      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const getLocalMinutesSinceMidnight = (date: Date): number => {
        return date.getHours() * 60 + date.getMinutes();
      };

      const bookingStartMin = getLocalMinutesSinceMidnight(scheduledAt);
      const bookingEndMin = getLocalMinutesSinceMidnight(endsAt);
      const openMin = timeToMinutes(timing.openTime);
      const closeMin = timeToMinutes(timing.closeTime);

      if (bookingStartMin < openMin || bookingEndMin > closeMin) {
        throw new BadRequestException(
          `Booking must be within outlet operating hours (${timing.openTime} - ${timing.closeTime})`,
        );
      }

      const startOfDay = new Date(scheduledAt);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(scheduledAt);
      endOfDay.setHours(23, 59, 59, 999);

      const blockedDate = await tx.outletBlockedDate.findFirst({
        where: {
          outletId,
          tenantId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (blockedDate) {
        throw new BadRequestException(`Outlet is closed on this date: ${blockedDate.reason || 'Holiday'}`);
      }

      let currentItemStart = new Date(scheduledAt);
      const itemsToCreate: any[] = [];

      for (const item of itemsDto) {
        const svc = services.find((s) => s.id === item.serviceId)!;
        const itemDuration = svc.duration;
        const itemEnd = new Date(currentItemStart.getTime() + itemDuration * 60000);
        const assignedStaffId = item.staffId ?? staffId;

        if (assignedStaffId) {
          const staff = await tx.user.findFirst({
            where: { id: assignedStaffId, tenantId, deletedAt: null },
            include: { staffProfile: true },
          });

          if (!staff) {
            throw new NotFoundException(`Staff member not found for service ${svc.name}`);
          }

          if (staff.staffProfile) {
            const profile = staff.staffProfile;
            if (profile.workingDays && !profile.workingDays.includes(dayOfWeek)) {
              throw new BadRequestException(`Staff ${staff.name} is not working on this day`);
            }

            if (profile.breakStart && profile.breakEnd) {
              const breakStartMin = timeToMinutes(profile.breakStart);
              const breakEndMin = timeToMinutes(profile.breakEnd);
              const itemStartMin = getLocalMinutesSinceMidnight(currentItemStart);
              const itemEndMin = getLocalMinutesSinceMidnight(itemEnd);

              if (itemStartMin < breakEndMin && itemEndMin > breakStartMin) {
                throw new ConflictException(`Staff ${staff.name} is on break during the requested time`);
              }
            }
          }

          const hasLeave = await tx.staffLeave.findFirst({
            where: {
              staffId: assignedStaffId,
              tenantId,
              status: 'APPROVED',
              startDate: { lte: itemEnd },
              endDate: { gte: currentItemStart },
            },
          });
          if (hasLeave) {
            throw new ConflictException(`Staff ${staff.name} is on leave/off-duty during this period`);
          }

          const blockedSlot = await tx.staffBlockSlot.findFirst({
            where: {
              staffId: assignedStaffId,
              tenantId,
              scheduledAt: { lt: itemEnd },
              endsAt: { gt: currentItemStart },
            },
          });
          if (blockedSlot) {
            throw new ConflictException(`Staff ${staff.name} is unavailable: ${blockedSlot.reason || 'Blocked Slot'}`);
          }

          const conflictingItems = await tx.bookingItem.findMany({
            where: {
              staffId: assignedStaffId,
              bookingId: { not: id },
              booking: {
                outletId,
                status: { notIn: [BookingStatus.CANCELLED] },
              },
              scheduledAt: { gte: startOfDay, lte: endOfDay },
            },
          });

          const hasItemConflict = conflictingItems.some(
            (bi) =>
              bi.scheduledAt && bi.endsAt &&
              currentItemStart < bi.endsAt &&
              itemEnd > bi.scheduledAt,
          );

          if (hasItemConflict) {
            throw new ConflictException(`Staff ${staff.name} is booked for another service during this slot`);
          }
        }

        const activePrice = svc.offerPrice !== null && svc.offerPrice !== undefined ? svc.offerPrice : svc.price;
        itemsToCreate.push({
          bookingId: id,
          serviceId: item.serviceId,
          staffId: assignedStaffId,
          scheduledAt: new Date(currentItemStart),
          endsAt: new Date(itemEnd),
          duration: itemDuration,
          price: activePrice,
        });

        currentItemStart = itemEnd;
      }

      await tx.bookingItem.deleteMany({
        where: { bookingId: id },
      });

      await tx.bookingItem.createMany({
        data: itemsToCreate,
      });

      return tx.booking.update({
        where: { id },
        data: {
          outletId,
          customerId,
          staffId,
          scheduledAt,
          endsAt,
          totalDuration,
          totalPrice,
          status: (dto as any).status ?? existing.status,
        },
        include: {
          items: { include: { service: true } },
          customer: true,
          staff: true,
          outlet: true,
        },
      });
    });
  }

  async cancel(id: string, reason?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    const updated = await this.bookingRepo.update(id, {
      status: BookingStatus.CANCELLED,
      cancellationReason: reason,
    });

    this.eventEmitter.emit(
      BookingCancelledEvent.EVENT,
      new BookingCancelledEvent(
        this.tenantCtx.tenantId,
        id,
        booking.customerId,
        reason,
      ),
    );

    return updated;
  }

  async complete(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    const updated = await this.bookingRepo.update(id, {
      status: BookingStatus.COMPLETED,
    });

    this.eventEmitter.emit(
      BookingCompletedEvent.EVENT,
      new BookingCompletedEvent(
        this.tenantCtx.tenantId,
        id,
        booking.customerId,
        booking.outletId,
      ),
    );

    return updated;
  }

  async findStaffSlots(outletId: string, staffId: string, date: Date): Promise<Booking[]> {
    return this.bookingRepo.findStaffSlots(outletId, staffId, date);
  }
}
