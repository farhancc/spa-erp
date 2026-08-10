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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CurrentUser, AuthUser } from '../../core/auth/current-user.decorator';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';

@ApiTags('POS')
@ApiBearerAuth()
@Controller('pos')
@Roles(Role.OWNER, Role.MANAGER)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @ApiOperation({ summary: 'Create a new invoice/transaction' })
  @Post('invoices')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    if (!isOwner && user.outletId) {
      dto.outletId = user.outletId;
    }
    return this.posService.create(dto);
  }

  @ApiOperation({ summary: 'List all invoices/transactions' })
  @Get('invoices')
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.posService.findAll({ page, limit, search, customerId, status, outletId, from, to });
  }

  @ApiOperation({ summary: 'Get a single invoice' })
  @Get('invoices/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.posService.findOne(id, outletId);
  }

  @ApiOperation({ summary: 'Update an invoice (edit details, cancel or refund)' })
  @Patch('invoices/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: { status?: string; notes?: string },
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.posService.update(id, dto, outletId);
  }

  @ApiOperation({ summary: 'Delete an invoice' })
  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.posService.remove(id, outletId);
  }
}
