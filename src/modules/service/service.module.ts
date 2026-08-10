import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceRepository } from './service.repository';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository],
  exports: [ServiceService],
})
export class ServiceModule {}
