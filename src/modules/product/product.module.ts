import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { DatabaseModule } from '../../core/database/database.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { LowStockReorderHandler } from './handlers/low-stock-reorder.handler';

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, LowStockReorderHandler],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}

