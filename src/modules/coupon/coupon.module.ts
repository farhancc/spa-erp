import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { DatabaseModule } from '../../core/database/database.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
  exports: [CouponService, CouponRepository],
})
export class CouponModule {}
