import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';
import {
  UpsertCommissionDto,
  RecordTipDto,
  ClockInDto,
  ClockOutDto,
  GeneratePayrollDto,
  ApprovePayrollDto,
} from './dto/payroll.dto';
import { RequiresFeature } from '../../core/permissions/features.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@RequiresFeature('analyticsEnabled')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ─── Commissions ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Upsert a commission rate for a staff member (per service or default)' })
  @Roles(Role.OWNER, Role.MANAGER)
  @Post('commissions')
  upsertCommission(@Body() dto: UpsertCommissionDto) {
    return this.payrollService.upsertCommission(dto);
  }

  @ApiOperation({ summary: 'List all commission rules for a staff member' })
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('commissions/:staffId')
  getCommissionsForStaff(@Param('staffId') staffId: string) {
    return this.payrollService.getCommissionsForStaff(staffId);
  }

  @ApiOperation({ summary: 'Delete a commission rule by ID' })
  @Roles(Role.OWNER)
  @Delete('commissions/:id')
  deleteCommission(@Param('id') id: string) {
    return this.payrollService.deleteCommission(id);
  }

  // ─── Tips ───────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Record a tip against an invoice' })
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  @Post('tips')
  recordTip(@Body() dto: RecordTipDto) {
    return this.payrollService.recordTip(dto);
  }

  @ApiOperation({ summary: 'Get tips for a specific invoice' })
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('tips/invoice/:invoiceId')
  getTipsForInvoice(@Param('invoiceId') invoiceId: string) {
    return this.payrollService.getTipsForInvoice(invoiceId);
  }

  @ApiOperation({ summary: 'Get tips earned by a staff member (optionally filtered by date)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('tips/staff/:staffId')
  getTipsForStaff(
    @Param('staffId') staffId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.payrollService.getTipsForStaff(staffId, from, to);
  }

  // ─── Attendance ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Clock in a staff member' })
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  @Post('attendance/clock-in')
  clockIn(@Body() dto: ClockInDto) {
    return this.payrollService.clockIn(dto);
  }

  @ApiOperation({ summary: 'Clock out a staff member by attendance record ID' })
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  @Patch('attendance/:id/clock-out')
  clockOut(@Param('id') id: string, @Body() dto: ClockOutDto) {
    return this.payrollService.clockOut(id, dto);
  }

  @ApiOperation({ summary: 'Query attendance records with optional filters' })
  @ApiQuery({ name: 'staffId', required: false })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('attendance')
  getAttendance(
    @Query('staffId') staffId?: string,
    @Query('outletId') outletId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.payrollService.getAttendance(staffId, outletId, from, to);
  }

  // ─── Payroll Periods ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Generate (or refresh) a payroll period for a staff member' })
  @Roles(Role.OWNER, Role.MANAGER)
  @Post('periods/generate')
  generatePayroll(@Body() dto: GeneratePayrollDto) {
    return this.payrollService.generatePayroll(dto);
  }

  @ApiOperation({ summary: 'List all payroll periods with optional filters' })
  @ApiQuery({ name: 'staffId', required: false })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'APPROVED', 'PAID'] })
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('periods')
  getPayrollPeriods(
    @Query('staffId') staffId?: string,
    @Query('outletId') outletId?: string,
    @Query('status') status?: string,
  ) {
    return this.payrollService.getPayrollPeriods(staffId, outletId, status);
  }

  @ApiOperation({ summary: 'Approve or mark a payroll period as PAID' })
  @Roles(Role.OWNER)
  @Patch('periods/:id/approve')
  approvePayroll(@Param('id') id: string, @Body() dto: ApprovePayrollDto) {
    return this.payrollService.approvePayroll(id, dto);
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get a cross-period payroll summary grouped by staff member' })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('summary')
  getPayrollSummary(
    @Query('outletId') outletId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.payrollService.getPayrollSummary(outletId, from, to);
  }
}
