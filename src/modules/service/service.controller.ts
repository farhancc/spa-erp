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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Public } from '../../core/auth/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @ApiOperation({ summary: 'Create a new service' })
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @ApiOperation({ summary: 'List all services (paginated/all)' })
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
      return this.serviceService.findAllList(outletId);
    }
    return this.serviceService.findAll({ page, limit, search, outletId });
  }

  @ApiOperation({ summary: 'Get a single service' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @ApiOperation({ summary: 'Update service details' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a service' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
