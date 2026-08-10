import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { CouponRepository } from './coupon.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepo: CouponRepository,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const tenantId = this.tenantCtx.tenantId;

    const existing = await this.couponRepo.findByCode(tenantId, dto.code.toUpperCase());
    if (existing) {
      throw new ConflictException(`Coupon with code "${dto.code}" already exists.`);
    }

    return this.couponRepo.create({
      tenantId,
      outletId: dto.outletId || null,
      code: dto.code.toUpperCase(),
      type: dto.type || 'PERCENTAGE',
      trigger: dto.trigger || 'MANUAL',
      value: Number(dto.value) || 0.0,
      minOrderValue: dto.minOrderValue !== undefined ? Number(dto.minOrderValue) : null,
      maxDiscount: dto.maxDiscount !== undefined ? Number(dto.maxDiscount) : null,
      usageLimit: dto.usageLimit !== undefined ? Number(dto.usageLimit) : null,
      perCustomerLimit: dto.perCustomerLimit !== undefined ? Number(dto.perCustomerLimit) : 1,
      usedCount: 0,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      isActive: dto.isActive ?? true,
    } as any);
  }

  async findAll(options: { page?: number; limit?: number; search?: string; outletId?: string } = {}): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.couponRepo.findByTenant(tenantId, options);
  }

  async findAllList(outletId?: string): Promise<Coupon[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.couponRepo.findAllByTenant(tenantId, outletId);
  }

  async findOne(id: string): Promise<Coupon> {
    const tenantId = this.tenantCtx.tenantId;
    const coupon = await this.couponRepo.findById(id);

    if (!coupon || coupon.tenantId !== tenantId) {
      throw new NotFoundException(`Coupon with ID "${id}" not found.`);
    }

    return coupon;
  }

  async validateCoupon(code: string, cartTotal: number): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const coupon = await this.couponRepo.findByCode(tenantId, code.toUpperCase());

    if (!coupon) {
      throw new NotFoundException(`Coupon code "${code}" is invalid.`);
    }

    if (!coupon.isActive) {
      throw new BadRequestException(`Coupon code "${code}" is inactive.`);
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      throw new BadRequestException(`Coupon code "${code}" is not yet valid.`);
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestException(`Coupon code "${code}" has expired.`);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException(`Coupon code "${code}" has reached its usage limit.`);
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue.toNumber()) {
      throw new BadRequestException(
        `Minimum order value of ₹${coupon.minOrderValue.toNumber()} required for coupon "${code}".`,
      );
    }

    // Calculate discount amount
    let discount = 0;
    const couponValue = coupon.value.toNumber();
    if (coupon.type === 'PERCENTAGE') {
      discount = cartTotal * (couponValue / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount.toNumber()) {
        discount = coupon.maxDiscount.toNumber();
      }
    } else {
      discount = couponValue;
    }

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: couponValue,
      discountAmount: Math.round(discount),
    };
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    await this.findOne(id); // validates tenant scope

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = dto.code.toUpperCase();
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.trigger !== undefined) updateData.trigger = dto.trigger;
    if (dto.value !== undefined) updateData.value = Number(dto.value);
    if (dto.minOrderValue !== undefined) updateData.minOrderValue = dto.minOrderValue !== null ? Number(dto.minOrderValue) : null;
    if (dto.maxDiscount !== undefined) updateData.maxDiscount = dto.maxDiscount !== null ? Number(dto.maxDiscount) : null;
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit !== null ? Number(dto.usageLimit) : null;
    if (dto.perCustomerLimit !== undefined) updateData.perCustomerLimit = Number(dto.perCustomerLimit);
    if (dto.validFrom !== undefined) updateData.validFrom = new Date(dto.validFrom);
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil !== null ? new Date(dto.validUntil) : null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.outletId !== undefined) updateData.outletId = dto.outletId;

    return this.couponRepo.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.couponRepo.delete(id);
  }
}
