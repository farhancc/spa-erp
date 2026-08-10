import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { OutletController } from './outlet.controller';
import { OutletService } from './outlet.service';
import { OutletRepository } from './outlet.repository';

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [OutletController],
  providers: [OutletService, OutletRepository],
  exports: [OutletService, OutletRepository],
})
export class OutletModule {}
