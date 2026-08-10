import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Public } from '../../core/auth/public.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'Create a new product' })
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @ApiOperation({ summary: 'List all products (paginated or all)' })
  @Public()
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('all') all?: boolean,
    @Query('outletId') outletId?: string,
  ) {
    if (all) {
      return this.productService.findAllList(outletId);
    }
    return this.productService.findAll({ page, limit, search, outletId });
  }

  @ApiOperation({ summary: 'Get a single product' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @ApiOperation({ summary: 'Update product details' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a product' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // ─── SUPPLIER CONSOLE ───
  @ApiOperation({ summary: 'List all suppliers' })
  @Get('suppliers/all')
  findSuppliers() {
    return this.productService.findSuppliers();
  }

  @ApiOperation({ summary: 'Create a supplier' })
  @Post('suppliers')
  createSupplier(@Body() dto: any) {
    return this.productService.createSupplier(dto);
  }

  @ApiOperation({ summary: 'Update a supplier' })
  @Patch('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() dto: any) {
    return this.productService.updateSupplier(id, dto);
  }

  @ApiOperation({ summary: 'Delete a supplier' })
  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSupplier(@Param('id') id: string) {
    return this.productService.removeSupplier(id);
  }

  // ─── PURCHASE ORDERS CONSOLE ───
  @ApiOperation({ summary: 'List all purchase orders' })
  @Get('purchase-orders/all')
  findPurchaseOrders() {
    return this.productService.findPurchaseOrders();
  }

  @ApiOperation({ summary: 'Create a purchase order' })
  @Post('purchase-orders')
  createPurchaseOrder(@Body() dto: any) {
    return this.productService.createPurchaseOrder(dto);
  }

  @ApiOperation({ summary: 'Update purchase order status' })
  @Patch('purchase-orders/:id/status')
  updatePurchaseOrderStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.productService.updatePurchaseOrderStatus(id, dto);
  }
}
