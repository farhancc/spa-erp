import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { Public } from '../../core/auth/public.decorator';

import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { RequiresFeature } from '../../core/permissions/features.decorator';

@ApiTags('Coupons')
@RequiresFeature('couponsEnabled')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @ApiOperation({ summary: 'Create a new coupon' })
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  @ApiOperation({ summary: 'List all coupons (paginated or all)' })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('outletId') outletId?: string,
    @Query('all') all?: boolean,
  ) {
    if (all) {
      return this.couponService.findAllList(outletId);
    }
    return this.couponService.findAll({ page, limit, search, outletId });
  }

  @ApiOperation({ summary: 'Validate a coupon for checkout' })
  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateCoupon(
    @Body('code') code: string,
    @Body('cartTotal') cartTotal: number,
  ) {
    return this.couponService.validateCoupon(code, cartTotal);
  }

  @ApiOperation({ summary: 'Get a single coupon' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @ApiOperation({ summary: 'Update coupon details' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a coupon' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }
}
