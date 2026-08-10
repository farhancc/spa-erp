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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OutletService } from './outlet.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { UpsertOutletTimingDto } from './dto/upsert-outlet-timing.dto';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';
import { Public } from '../../core/auth/public.decorator';

@ApiTags('Outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new outlet for the tenant' })
  create(@Body() dto: CreateOutletDto) {
    return this.outletService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all outlets for the tenant' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('activeOnly') activeOnly?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.outletService.findAll({ activeOnly, page, limit });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single outlet with timings' })
  findOne(@Param('id') id: string) {
    return this.outletService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update outlet details' })
  update(@Param('id') id: string, @Body() dto: UpdateOutletDto) {
    return this.outletService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an outlet (not allowed if only/default outlet)' })
  remove(@Param('id') id: string) {
    return this.outletService.remove(id);
  }

  // ─── Default Outlet ───────────────────────────────────────────────────────

  @Patch(':id/set-default')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Mark an outlet as the default' })
  setDefault(@Param('id') id: string) {
    return this.outletService.setDefaultOutlet(id);
  }

  // ─── Timings ──────────────────────────────────────────────────────────────

  @Get(':id/timings')
  @Public()
  @ApiOperation({ summary: 'Get outlet operating hours' })
  getTimings(@Param('id') id: string) {
    return this.outletService.getTimings(id);
  }

  @Patch(':id/timings')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Upsert a single day timing for an outlet' })
  upsertTiming(@Param('id') outletId: string, @Body() dto: UpsertOutletTimingDto) {
    return this.outletService.upsertTiming(outletId, dto);
  }
}
