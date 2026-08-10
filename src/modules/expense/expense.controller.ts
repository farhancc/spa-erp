import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';
import { CurrentUser, AuthUser } from '../../core/auth/current-user.decorator';

@ApiTags('Expense Tracking')
@ApiBearerAuth()
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Log a new operational expense transaction' })
  createExpense(
    @Body() dto: {
      outletId?: string;
      category: string;
      amount: number;
      description?: string;
      spentAt: string;
      receiptUrl?: string;
    },
  ) {
    return this.expenseService.createExpense(dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Retrieve logged operational expenses' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  getExpenses(
    @CurrentUser() user: AuthUser,
    @Query('outletId') queryOutletId?: string,
    @Query('category') category?: string,
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? queryOutletId : (user.outletId || undefined);
    return this.expenseService.getExpenses({ outletId, category });
  }

  @Get('net-profit')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Generate detailed Net Profit reports' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End Date (YYYY-MM-DD)' })
  getNetProfitReport(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.expenseService.getNetProfitReport(from, to, outletId);
  }
}
