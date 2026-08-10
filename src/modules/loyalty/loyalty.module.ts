import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyRepository } from './loyalty.repository';

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, LoyaltyRepository],
  exports: [LoyaltyService, LoyaltyRepository],
})
export class LoyaltyModule {}
