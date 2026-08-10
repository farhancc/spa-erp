import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('PosService', () => {
  let service: PosService;
  let prisma: any;
  let eventEmitter: any;

  const mockTenantCtx = {
    tenantId: 'tenant-123',
  };

  const mockPosRepo = {
    generateInvoiceNumber: jest.fn().mockResolvedValue('INV-2026-0001'),
    findByIdWithDetails: jest.fn(),
  };

  const mockAuditLog = {
    record: jest.fn().mockResolvedValue(null),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      service: {
        findMany: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      customer: {
        update: jest.fn(),
      },
      coupon: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      couponUsage: {
        create: jest.fn(),
      },
      loyaltyProgram: {
        findUnique: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
        update: jest.fn(),
      },
      invoiceItem: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: mockPosRepo },
        { provide: PrismaService, useValue: prisma },
        { provide: TenantContextService, useValue: mockTenantCtx },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateInvoiceDto = {
      customerId: 'customer-1',
      outletId: 'outlet-1',
      subtotal: 100,
      totalAmount: 118,
      gstAmount: 18,
      discountAmount: 0,
      loyaltyDiscount: 0,
      paymentMethod: 'CASH',
      status: 'PAID',
      items: [
        {
          productId: 'prod-1',
          name: 'Hair Wax',
          quantity: 2,
          unitPrice: 50,
          total: 100,
        },
      ],
    };

    beforeEach(() => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        trackStock: true,
        stockQty: 5,
        name: 'Hair Wax',
        sku: 'HW-01',
        outletId: 'outlet-1',
      });
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          hsnSacCode: '33059040',
        }
      ]);
      prisma.service.findMany.mockResolvedValue([]);
      prisma.invoice.create.mockResolvedValue({ id: 'inv-1', tenantId: 'tenant-123' });
      prisma.payment.create.mockResolvedValue({ id: 'pm-1' });
      prisma.loyaltyProgram.findUnique.mockResolvedValue({
        isActive: true,
        pointsPerRupee: 2.0, // 2 points per rupee spent
      });
      mockPosRepo.findByIdWithDetails.mockResolvedValue({
        id: 'inv-1',
        tenantId: 'tenant-123',
        customerId: 'customer-1',
        totalAmount: 118,
      });
      prisma.customer.update.mockResolvedValue({
        id: 'customer-1',
        totalVisits: 2,
        referredById: null,
      });
    });

    it('should throw BadRequestException if stock is insufficient for a product with trackStock=true', async () => {
      // Product only has 1 in stock, but request asks for 2
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        trackStock: true,
        stockQty: 1,
        name: 'Hair Wax',
        sku: 'HW-01',
        outletId: 'outlet-1',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should successfully create invoice, payment, decrement stock, and update customer visits', async () => {
      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(prisma.invoice.create).toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQty: 3 }, // 5 - 2
      });
      expect(prisma.customer.update).toHaveBeenCalled();
    });

    it('should record coupon usage and audit logs when couponId is provided', async () => {
      const couponDto = { ...dto, couponId: 'coupon-1', discountAmount: 10 };
      prisma.coupon.findUnique.mockResolvedValue({ id: 'coupon-1', code: 'SAVE10', usedCount: 0 });
      prisma.couponUsage.create.mockResolvedValue({ id: 'usage-1' });

      await service.create(couponDto);

      expect(prisma.couponUsage.create).toHaveBeenCalled();
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-1' },
        data: { usedCount: { increment: 1 } },
      });
      expect(mockAuditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityName: 'CouponUsage',
        }),
        expect.any(Object),
      );
    });
  });
});
