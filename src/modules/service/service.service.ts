import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@prisma/client';
import { ServiceRepository } from './service.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(
    private readonly serviceRepo: ServiceRepository,
    private readonly tenantCtx: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateServiceDto): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;

    // Dynamically resolve category
    const categoryName = dto.category || 'General';
    let category = await this.prisma.serviceCategory.findFirst({
      where: { tenantId, name: categoryName },
    });

    if (!category) {
      category = await this.prisma.serviceCategory.create({
        data: {
          tenantId,
          name: categoryName,
          isActive: true,
        },
      });
    }

    const newService = await this.serviceRepo.create({
      tenantId,
      outletId: dto.outletId || null,
      categoryId: category.id,
      name: dto.name,
      description: dto.description || null,
      duration: dto.duration,
      price: dto.price,
      offerPrice: (dto.offerPrice !== null && dto.offerPrice !== undefined) ? Number(dto.offerPrice) : null,
      isCombo: dto.isCombo ?? false,
      comboServiceIds: dto.comboServiceIds || [],
      gender: dto.gender || 'UNISEX',
      bodyPart: dto.bodyPart || null,
      gstType: dto.gstType || 'NONE',
      gstRate: dto.gstRate || null,
      loyaltyPoints: dto.loyaltyPoints ?? 0,
      images: dto.images || [],
      tags: dto.tags || [],
      imageUrl: dto.imageUrl || null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    } as any);

    return this.mapServiceResponse(newService, categoryName);
  }

  async findAll(options: { page?: number; limit?: number; search?: string; outletId?: string } = {}): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const paginated = await this.serviceRepo.findByTenant(tenantId, options);
    
    // Map data
    const mappedData = await Promise.all(
      paginated.data.map(async (service) => {
        const fullService = await this.serviceRepo.findByIdWithCategory(service.id);
        return this.mapServiceResponse(fullService, fullService.category?.name);
      }),
    );

    return {
      data: mappedData,
      meta: paginated.meta,
    };
  }

  async findAllList(outletId?: string): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    const services = await this.serviceRepo.findByTenantAll(tenantId, outletId) as any[];
    return services.map(s => this.mapServiceResponse(s, s.category?.name));
  }

  async findOne(id: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const service = await this.serviceRepo.findByIdWithCategory(id);

    if (!service || service.tenantId !== tenantId || service.deletedAt) {
      throw new NotFoundException(`Service with ID "${id}" not found.`);
    }

    return this.mapServiceResponse(service, service.category?.name);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const existing = await this.findOne(id); // validates tenant scope

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.bodyPart !== undefined) updateData.bodyPart = dto.bodyPart || null;
    if (dto.gstType !== undefined) updateData.gstType = dto.gstType;
    if (dto.gstRate !== undefined) updateData.gstRate = dto.gstRate;
    if (dto.loyaltyPoints !== undefined) updateData.loyaltyPoints = dto.loyaltyPoints;
    if (dto.images !== undefined) updateData.images = dto.images;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.outletId !== undefined) updateData.outletId = dto.outletId || null;
    if (dto.offerPrice !== undefined) updateData.offerPrice = dto.offerPrice !== null ? Number(dto.offerPrice) : null;
    if (dto.isCombo !== undefined) updateData.isCombo = dto.isCombo;
    if (dto.comboServiceIds !== undefined) updateData.comboServiceIds = dto.comboServiceIds;

    if (dto.category !== undefined) {
      // Resolve category
      let category = await this.prisma.serviceCategory.findFirst({
        where: { tenantId, name: dto.category },
      });

      if (!category) {
        category = await this.prisma.serviceCategory.create({
          data: {
            tenantId,
            name: dto.category,
            isActive: true,
          },
        });
      }
      updateData.categoryId = category.id;
    }

    const updated = await this.serviceRepo.update(id, updateData);
    const fullUpdated = await this.serviceRepo.findByIdWithCategory(updated.id);
    return this.mapServiceResponse(fullUpdated, fullUpdated.category?.name);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // validates tenant scope
    await this.serviceRepo.update(id, { deletedAt: new Date() } as any);
  }

  private mapServiceResponse(service: any, categoryName?: string): any {
    return {
      id: service.id,
      name: service.name,
      category: categoryName || 'General',
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      offerPrice: (service.offerPrice !== null && service.offerPrice !== undefined) ? Number(service.offerPrice) : null,
      isCombo: service.isCombo || false,
      comboServiceIds: service.comboServiceIds || [],
      gender: service.gender || 'UNISEX',
      bodyPart: service.bodyPart || null,
      gstType: service.gstType,
      gstRate: service.gstRate,
      loyaltyPoints: service.loyaltyPoints,
      images: service.images || [],
      tags: service.tags || [],
      imageUrl: service.imageUrl || '',
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      outletId: service.outletId || null,
    };
  }
}
