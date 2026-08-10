import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DatabaseModule } from '../../core/database/database.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
