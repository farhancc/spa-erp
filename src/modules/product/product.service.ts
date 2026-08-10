import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductRepository } from './product.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly tenantCtx: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  private async getOrCreateDefaultCategory(tenantId: string): Promise<string> {
    const existing = await this.prisma.productCategory.findFirst({
      where: { tenantId, name: 'General' },
    });

    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.productCategory.create({
      data: {
        tenantId,
        name: 'General',
        isActive: true,
      },
    });

    return created.id;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const tenantId = this.tenantCtx.tenantId;

    const categoryId = dto.categoryId || (await this.getOrCreateDefaultCategory(tenantId));

    return this.productRepo.create({
      tenantId,
      outletId: dto.outletId || null,
      categoryId,
      supplierId: dto.supplierId || null,
      name: dto.name,
      description: dto.description || null,
      sku: dto.sku || null,
      price: Number(dto.price) || 0.0,
      costPrice: Number(dto.costPrice) || 0.0,
      lowStockThreshold: dto.lowStockThreshold !== undefined ? Number(dto.lowStockThreshold) : 5,
      gstType: dto.gstType || 'NONE',
      gstRate: dto.gstRate !== undefined ? Number(dto.gstRate) : null,
      stockQty: dto.stockQty !== undefined ? Number(dto.stockQty) : 0,
      trackStock: dto.trackStock ?? true,
      imageUrl: dto.imageUrl || null,
      isActive: dto.isActive ?? true,
    } as any);
  }

  async findAll(options: { page?: number; limit?: number; search?: string; outletId?: string } = {}): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.productRepo.findByTenant(tenantId, options);
  }

  async findAllList(outletId?: string): Promise<Product[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.productRepo.findAllByTenant(tenantId, outletId);
  }

  async findOne(id: string): Promise<Product> {
    const tenantId = this.tenantCtx.tenantId;
    const product = await this.productRepo.findById(id);

    if (!product || product.tenantId !== tenantId || product.deletedAt) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id); // validates tenant scope

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.price !== undefined) updateData.price = Number(dto.price);
    if (dto.costPrice !== undefined) updateData.costPrice = Number(dto.costPrice);
    if (dto.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(dto.lowStockThreshold);
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId || null;
    if (dto.gstType !== undefined) updateData.gstType = dto.gstType;
    if (dto.gstRate !== undefined) updateData.gstRate = Number(dto.gstRate);
    if (dto.stockQty !== undefined) updateData.stockQty = Number(dto.stockQty);
    if (dto.trackStock !== undefined) updateData.trackStock = dto.trackStock;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;

    return this.productRepo.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.productRepo.update(id, { deletedAt: new Date() } as any);
  }

  // ─── SUPPLIER MANAGEMENT ───
  async createSupplier(dto: any): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.supplier.create({
      data: {
        tenantId,
        name: dto.name,
        contactName: dto.contactName || null,
        email: dto.email || null,
        phone: dto.phone || null,
      },
    });
  }

  async findSuppliers(): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async updateSupplier(id: string, dto: any): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    await this.prisma.supplier.updateMany({
      where: { id, tenantId },
      data: {
        name: dto.name,
        contactName: dto.contactName || null,
        email: dto.email || null,
        phone: dto.phone || null,
      },
    });
    return this.prisma.supplier.findFirst({ where: { id } });
  }

  async removeSupplier(id: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.supplier.deleteMany({
      where: { id, tenantId },
    });
  }

  // ─── PURCHASE ORDERS ───
  async createPurchaseOrder(dto: any): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    
    let total = 0;
    for (const item of dto.items) {
      total += Number(item.costPrice) * Number(item.quantity);
    }

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: dto.supplierId,
        notes: dto.notes || null,
        status: 'DRAFT',
        totalAmount: total,
        items: {
          create: dto.items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            costPrice: Number(item.costPrice),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    });
  }

  async findPurchaseOrders(): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePurchaseOrderStatus(id: string, dto: { status: string }): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID "${id}" not found.`);
    }

    if (dto.status === 'RECEIVED' && po.status !== 'RECEIVED') {
      for (const item of po.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    });
  }
}
