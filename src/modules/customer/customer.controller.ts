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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Public } from '../../core/auth/public.decorator';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Create a new customer' })
  @Public() // Bypassing JWT checks for initial frontend alignment
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @ApiOperation({ summary: 'List all customers (paginated)' })
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
      return this.customerService.findAllList(outletId);
    }
    return this.customerService.findAll({ page, limit, search, outletId });
  }

  @ApiOperation({ summary: 'Get complete dynamic data for the customer portal dashboard' })
  @Public()
  @Get(':id/portal-dashboard')
  getPortalDashboard(@Param('id') id: string) {
    return this.customerService.getPortalDashboard(id);
  }

  @ApiOperation({ summary: 'Get a single customer' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @ApiOperation({ summary: 'Update customer details' })
  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a customer' })
  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  // ─── CUSTOMER SEGMENTS ───
  @ApiOperation({ summary: 'List all customer segments' })
  @Public()
  @Get('segments/all')
  findSegments() {
    return this.customerService.findSegments();
  }

  @ApiOperation({ summary: 'Create a customer segment' })
  @Public()
  @Post('segments')
  createSegment(@Body() dto: any) {
    return this.customerService.createSegment(dto);
  }

  @ApiOperation({ summary: 'Delete a customer segment' })
  @Public()
  @Delete('segments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSegment(@Param('id') id: string) {
    return this.customerService.removeSegment(id);
  }

  @ApiOperation({ summary: 'Get members of a segment' })
  @Public()
  @Get('segments/:id/members')
  findSegmentMembers(@Param('id') id: string) {
    return this.customerService.findSegmentMembers(id);
  }
}
