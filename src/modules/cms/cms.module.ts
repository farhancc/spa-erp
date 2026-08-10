import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { CmsRepository } from './cms.repository';

@Module({
  controllers: [CmsController],
  providers: [CmsService, CmsRepository],
  exports: [CmsService],
})
export class CmsModule {}
