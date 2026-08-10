import { Module } from '@nestjs/common';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { DatabaseModule } from '../../core/database/database.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
