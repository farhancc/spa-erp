import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';
import { CurrentUser, AuthUser } from '../../core/auth/current-user.decorator';
import { RequiresFeature } from '../../core/permissions/features.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@RequiresFeature('reportsEnabled')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'High-level revenue & activity summary' })
  getRevenueSummary(@CurrentUser() user: AuthUser) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getRevenueSummary(outletId);
  }

  @Get('daily-revenue')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Daily revenue time-series for the last N days' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of past days (default 30)' })
  getDailyRevenue(
    @CurrentUser() user: AuthUser,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getDailyRevenue(days, outletId);
  }

  @Get('outlets')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Per-outlet revenue, bookings, and customer counts' })
  getOutletPerformance() {
    return this.reportsService.getOutletPerformance();
  }

  @Get('staff')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Per-staff bookings completed and revenue generated' })
  getStaffPerformance(@CurrentUser() user: AuthUser) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getStaffPerformance(outletId);
  }

  @Get('services')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Most popular services by booking count and revenue' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getServicePopularity(
    @CurrentUser() user: AuthUser,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getServicePopularity(limit, outletId);
  }

  @Get('retention')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Customer retention stats: new vs repeat vs at-risk' })
  getRetentionStats(@CurrentUser() user: AuthUser) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getRetentionStats(outletId);
  }

  @Get('bookings')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Booking analytics: completion, cancellation, no-show rates' })
  getBookingAnalytics(@CurrentUser() user: AuthUser) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getBookingAnalytics(outletId);
  }

  @Get('gstr')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'GSTR-1 & GSTR-3B compliant GST summary report' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End Date (YYYY-MM-DD)' })
  getGstrReport(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getGstrReport(from, to, outletId);
  }

  @Get('forecast')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Predictive revenue forecasting, stylist utilization & no-show probability' })
  getRevenueForecast(@CurrentUser() user: AuthUser) {
    const isOwner = user.role === Role.OWNER || user.role === Role.SUPER_ADMIN;
    const outletId = isOwner ? undefined : (user.outletId || undefined);
    return this.reportsService.getRevenueForecast(outletId);
  }
}

