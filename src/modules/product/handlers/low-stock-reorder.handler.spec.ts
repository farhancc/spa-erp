import { Test, TestingModule } from '@nestjs/testing';
import { LowStockReorderHandler } from './low-stock-reorder.handler';
import { PrismaService } from '../../../core/database/prisma.service';
import { ProductLowStockEvent } from '../../../core/events/domain-events';

describe('LowStockReorderHandler', () => {
  let handler: LowStockReorderHandler;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: jest.fn(),
      },
      purchaseOrder: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      purchaseOrderItem: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LowStockReorderHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<LowStockReorderHandler>(LowStockReorderHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should skip PO creation if product has no supplierId', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Test Product',
      costPrice: 50.0,
      lowStockThreshold: 5,
      supplierId: null, // No supplier
    });

    const event = new ProductLowStockEvent(
      'tenant-1',
      'prod-1',
      'Test Product',
      'SKU-1',
      'outlet-1',
      10,
      3
    );

    await handler.handleProductLowStock(event);

    expect(prisma.purchaseOrder.findFirst).not.toHaveBeenCalled();
    expect(prisma.purchaseOrder.create).not.toHaveBeenCalled();
  });

  it('should create a new draft PO if none exists for the supplier', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Test Product',
      costPrice: 50.0,
      lowStockThreshold: 5,
      supplierId: 'supplier-1',
    });

    prisma.purchaseOrder.findFirst.mockResolvedValue(null); // No existing PO

    const event = new ProductLowStockEvent(
      'tenant-1',
      'prod-1',
      'Test Product',
      'SKU-1',
      'outlet-1',
      10,
      3
    );

    await handler.handleProductLowStock(event);

    expect(prisma.purchaseOrder.findFirst).toHaveBeenCalled();
    expect(prisma.purchaseOrder.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        status: 'DRAFT',
        totalAmount: 500.0, // quantity 10 (Math.max(10, 5 * 2)) * 50 costPrice
        notes: expect.any(String),
        items: {
          create: [
            {
              productId: 'prod-1',
              quantity: 10,
              costPrice: 50.0,
            },
          ],
        },
      },
    });
  });

  it('should append item to existing draft PO and update totalAmount', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Test Product',
      costPrice: 50.0,
      lowStockThreshold: 5,
      supplierId: 'supplier-1',
    });

    const existingPo = {
      id: 'po-existing',
      tenantId: 'tenant-1',
      supplierId: 'supplier-1',
      status: 'DRAFT',
      items: [
        {
          id: 'poi-other',
          productId: 'prod-other',
          quantity: 5,
          costPrice: 100.0,
        },
      ],
    };

    prisma.purchaseOrder.findFirst.mockResolvedValue(existingPo);

    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      { productId: 'prod-other', quantity: 5, costPrice: 100.0 },
      { productId: 'prod-1', quantity: 10, costPrice: 50.0 },
    ]);

    const event = new ProductLowStockEvent(
      'tenant-1',
      'prod-1',
      'Test Product',
      'SKU-1',
      'outlet-1',
      10,
      3
    );

    await handler.handleProductLowStock(event);

    expect(prisma.purchaseOrderItem.create).toHaveBeenCalledWith({
      data: {
        purchaseOrderId: 'po-existing',
        productId: 'prod-1',
        quantity: 10,
        costPrice: 50.0,
      },
    });

    expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-existing' },
      data: {
        totalAmount: 1000.0, // 5 * 100 + 10 * 50
        notes: expect.any(String),
      },
    });
  });
});
