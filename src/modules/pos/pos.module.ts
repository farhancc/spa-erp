import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';

@Module({
  controllers: [PosController],
  providers: [PosService, PosRepository],
  exports: [PosService],
})
export class PosModule {}
