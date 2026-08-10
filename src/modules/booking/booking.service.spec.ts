import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../../shared/types/enums';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: any;

  const mockTenantCtx = {
    tenantId: 'tenant-123',
  };

  const mockBookingRepo = {
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    prisma = {
      outlet: {
        findFirst: jest.fn(),
      },
      outletTiming: {
        findUnique: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      service: {
        findMany: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      bookingItem: {
        findMany: jest.fn(),
      },
      outletBlockedDate: {
        findFirst: jest.fn(),
      },
      staffLeave: {
        findFirst: jest.fn(),
      },
      staffBlockSlot: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: BookingRepository, useValue: mockBookingRepo },
        { provide: PrismaService, useValue: prisma },
        { provide: TenantContextService, useValue: mockTenantCtx },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      customerId: 'customer-1',
      outletId: 'outlet-1',
      staffId: 'staff-1',
      scheduledAt: new Date(Date.now() + 3600 * 1000), // Date object
      items: [{ serviceId: 'service-1' }],
      notes: 'No ice cream please',
    } as any;

    beforeEach(() => {
      prisma.outlet.findFirst.mockResolvedValue({ id: 'outlet-1', tenantId: 'tenant-123' });
      prisma.customer.findFirst.mockResolvedValue({ id: 'customer-1', tenantId: 'tenant-123' });
      prisma.service.findMany.mockResolvedValue([
        { id: 'service-1', duration: 30, price: 50.0, tenantId: 'tenant-123' },
      ]);
      prisma.outletTiming.findUnique.mockResolvedValue({
        id: 'timing-1',
        outletId: 'outlet-1',
        dayOfWeek: new Date(createDto.scheduledAt).getDay(),
        openTime: '00:00',
        closeTime: '23:59',
        isClosed: false,
      });
      prisma.user.findFirst.mockResolvedValue({
        id: 'staff-1',
        tenantId: 'tenant-123',
        deletedAt: null,
        staffProfile: {
          id: 'profile-1',
          workingDays: [0, 1, 2, 3, 4, 5, 6],
          breakStart: null,
          breakEnd: null,
        },
      });
      prisma.outletBlockedDate.findFirst.mockResolvedValue(null);
      prisma.staffLeave.findFirst.mockResolvedValue(null);
      prisma.staffBlockSlot.findFirst.mockResolvedValue(null);
    });

    it('should throw ConflictException if staff member has an overlapping booking', async () => {
      // Overlapping booking: starts 15 min before new booking starts, lasts 30 min (overlaps)
      const scheduledAtTime = new Date(createDto.scheduledAt).getTime();
      const existingBookingItem = {
        id: 'existing-bi-id',
        bookingId: 'existing-booking-id',
        serviceId: 'service-1',
        staffId: 'staff-1',
        scheduledAt: new Date(scheduledAtTime - 15 * 60000),
        endsAt: new Date(scheduledAtTime + 15 * 60000),
        duration: 30,
        price: 50.0,
      };

      prisma.bookingItem.findMany.mockResolvedValue([existingBookingItem]);

      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create booking successfully when no staff conflict exists', async () => {
      // Non-overlapping booking: ends before new booking starts
      const scheduledAtTime = new Date(createDto.scheduledAt).getTime();
      const existingBookingItem = {
        id: 'existing-bi-id',
        bookingId: 'existing-booking-id',
        serviceId: 'service-1',
        staffId: 'staff-1',
        scheduledAt: new Date(scheduledAtTime - 60 * 60000),
        endsAt: new Date(scheduledAtTime - 30 * 60000),
        duration: 30,
        price: 50.0,
      };

      prisma.bookingItem.findMany.mockResolvedValue([existingBookingItem]);
      prisma.booking.create.mockResolvedValue({
        id: 'new-booking-id',
        tenantId: 'tenant-123',
        ...createDto,
        scheduledAt: new Date(createDto.scheduledAt),
        endsAt: new Date(scheduledAtTime + 30 * 60000),
        totalDuration: 30,
        totalPrice: 50.0,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.create(createDto, 'user-id-123');
      expect(result).toBeDefined();
      expect(result.id).toBe('new-booking-id');
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if outlet is closed on the day of booking', async () => {
      prisma.outletTiming.findUnique.mockResolvedValue({
        id: 'timing-1',
        outletId: 'outlet-1',
        dayOfWeek: new Date(createDto.scheduledAt).getDay(),
        isClosed: true,
      });

      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if booking is outside outlet working hours', async () => {
      prisma.outletTiming.findUnique.mockResolvedValue({
        id: 'timing-1',
        outletId: 'outlet-1',
        dayOfWeek: new Date(createDto.scheduledAt).getDay(),
        openTime: '18:00',
        closeTime: '20:00',
        isClosed: false,
      });

      // createDto scheduledAt is likely outside 18:00-20:00 depending on mock time
      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if staff is not working on booking day', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'staff-1',
        tenantId: 'tenant-123',
        deletedAt: null,
        staffProfile: {
          id: 'profile-1',
          workingDays: [], // working no days
          breakStart: null,
          breakEnd: null,
        },
      });

      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if booking falls during staff break', async () => {
      const scheduledTime = new Date(createDto.scheduledAt);
      const hours = scheduledTime.getHours();
      const minutes = scheduledTime.getMinutes();

      prisma.user.findFirst.mockResolvedValue({
        id: 'staff-1',
        tenantId: 'tenant-123',
        deletedAt: null,
        staffProfile: {
          id: 'profile-1',
          workingDays: [0, 1, 2, 3, 4, 5, 6],
          breakStart: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
          breakEnd: `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        },
      });

      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
