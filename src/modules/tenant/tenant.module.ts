import { Module } from '@nestjs/common';
import { TenantController, DemoBookingController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantRepository } from './tenant.repository';

@Module({
  controllers: [TenantController, DemoBookingController],
  providers: [TenantService, TenantRepository],
  exports: [TenantService],
})
export class TenantModule { }
