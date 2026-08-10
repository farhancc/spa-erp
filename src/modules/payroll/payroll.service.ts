import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import {
  UpsertCommissionDto,
  RecordTipDto,
  ClockInDto,
  ClockOutDto,
  GeneratePayrollDto,
  ApprovePayrollDto,
} from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  // ─── Commission Rates ───────────────────────────────────────────────────────

  async upsertCommission(dto: UpsertCommissionDto) {
    const tenantId = this.tenantCtx.tenantId;

    // Verify staff exists and belongs to tenant
    const staff = await this.prisma.user.findFirst({
      where: { id: dto.staffId, tenantId, deletedAt: null },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    if (dto.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, tenantId, deletedAt: null },
      });
      if (!service) throw new NotFoundException('Service not found');
    }

    const existing = await this.prisma.staffCommission.findFirst({
      where: {
        staffId: dto.staffId,
        serviceId: dto.serviceId ?? null,
      },
    });

    if (existing) {
      return this.prisma.staffCommission.update({
        where: { id: existing.id },
        data: { type: dto.type, rate: dto.rate },
      });
    }

    return this.prisma.staffCommission.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        serviceId: dto.serviceId ?? null,
        type: dto.type,
        rate: dto.rate,
      },
    });
  }

  async getCommissionsForStaff(staffId: string) {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.staffCommission.findMany({
      where: { tenantId, staffId },
      include: { service: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteCommission(id: string) {
    const tenantId = this.tenantCtx.tenantId;
    const commission = await this.prisma.staffCommission.findFirst({ where: { id, tenantId } });
    if (!commission) throw new NotFoundException('Commission rule not found');
    await this.prisma.staffCommission.delete({ where: { id } });
  }

  // ─── Tip Tracking ───────────────────────────────────────────────────────────

  async recordTip(dto: RecordTipDto) {
    const tenantId = this.tenantCtx.tenantId;

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (dto.staffId) {
      const staff = await this.prisma.user.findFirst({
        where: { id: dto.staffId, tenantId, deletedAt: null },
      });
      if (!staff) throw new NotFoundException('Staff member not found');
    }

    return this.prisma.tip.create({
      data: {
        tenantId,
        invoiceId: dto.invoiceId,
        staffId: dto.staffId ?? null,
        amount: dto.amount,
        method: dto.method,
        notes: dto.notes ?? null,
      },
    });
  }

  async getTipsForInvoice(invoiceId: string) {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.tip.findMany({
      where: { tenantId, invoiceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTipsForStaff(staffId: string, from?: string, to?: string) {
    const tenantId = this.tenantCtx.tenantId;
    const where: any = { tenantId, staffId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    return this.prisma.tip.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  // ─── Attendance (Clock-in / Clock-out) ──────────────────────────────────────

  async clockIn(dto: ClockInDto) {
    const tenantId = this.tenantCtx.tenantId;

    const staff = await this.prisma.user.findFirst({
      where: { id: dto.staffId, tenantId, deletedAt: null },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const outlet = await this.prisma.outlet.findFirst({
      where: { id: dto.outletId, tenantId },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');

    // Prevent double clock-in (open shift exists)
    const openShift = await this.prisma.staffAttendance.findFirst({
      where: { tenantId, staffId: dto.staffId, clockOut: null },
    });
    if (openShift) {
      throw new ConflictException('Staff already has an open clock-in. Clock out first.');
    }

    const clockIn = dto.clockIn ? new Date(dto.clockIn) : new Date();

    return this.prisma.staffAttendance.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        outletId: dto.outletId,
        clockIn,
        notes: dto.notes ?? null,
      },
    });
  }

  async clockOut(attendanceId: string, dto: ClockOutDto) {
    const tenantId = this.tenantCtx.tenantId;

    const attendance = await this.prisma.staffAttendance.findFirst({
      where: { id: attendanceId, tenantId },
    });
    if (!attendance) throw new NotFoundException('Attendance record not found');
    if (attendance.clockOut) throw new ConflictException('Already clocked out');

    const clockOut = dto.clockOut ? new Date(dto.clockOut) : new Date();
    if (clockOut <= attendance.clockIn) {
      throw new BadRequestException('Clock-out time must be after clock-in time');
    }

    const durationMin = Math.round(
      (clockOut.getTime() - attendance.clockIn.getTime()) / 60000,
    );

    return this.prisma.staffAttendance.update({
      where: { id: attendanceId },
      data: {
        clockOut,
        durationMin,
        notes: dto.notes ?? attendance.notes,
      },
    });
  }

  async getAttendance(staffId?: string, outletId?: string, from?: string, to?: string) {
    const tenantId = this.tenantCtx.tenantId;
    const where: any = { tenantId };
    if (staffId) where.staffId = staffId;
    if (outletId) where.outletId = outletId;
    if (from || to) {
      where.clockIn = {};
      if (from) where.clockIn.gte = new Date(from);
      if (to) where.clockIn.lte = new Date(to);
    }
    return this.prisma.staffAttendance.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, role: true } },
        outlet: { select: { id: true, name: true } },
      },
      orderBy: { clockIn: 'desc' },
    });
  }

  // ─── Payroll Period Generation ───────────────────────────────────────────────

  async generatePayroll(dto: GeneratePayrollDto) {
    const tenantId = this.tenantCtx.tenantId;
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (periodEnd <= periodStart) {
      throw new BadRequestException('periodEnd must be after periodStart');
    }

    const staff = await this.prisma.user.findFirst({
      where: { id: dto.staffId, tenantId, deletedAt: null },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    // ── 1. Fetch all PAID invoices where this staff member created an item ──────
    //    We identify "attributed" revenue by looking at InvoiceItems where staffId
    //    matches (via the parent booking's staffId), within the date range.
    const invoiceItems = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: {
          tenantId,
          status: 'PAID',
          createdAt: { gte: periodStart, lte: periodEnd },
          ...(dto.outletId ? { outletId: dto.outletId } : {}),
        },
        OR: [
          { invoice: { createdById: dto.staffId } },
          { invoice: { booking: { staffId: dto.staffId } } },
        ],
      },
      include: {
        invoice: true,
      },
    });

    const serviceRevenue = invoiceItems.reduce((acc, item) => acc + Number(item.total), 0);
    const totalServices = invoiceItems.length;

    // ── 2. Calculate commission ──────────────────────────────────────────────
    // Per item: look for a service-specific rate, then fall back to the default rate.
    const commissions = await this.prisma.staffCommission.findMany({
      where: { tenantId, staffId: dto.staffId },
    });

    const defaultRate = commissions.find((c) => c.serviceId === null);
    let commissionEarned = 0;

    for (const item of invoiceItems) {
      const serviceRate = commissions.find((c) => c.serviceId === item.serviceId);
      const rule = serviceRate ?? defaultRate;
      if (!rule) continue;

      const itemTotal = Number(item.total);
      if (rule.type === 'PERCENTAGE') {
        commissionEarned += itemTotal * (Number(rule.rate) / 100);
      } else {
        commissionEarned += Number(rule.rate);
      }
    }

    // ── 3. Sum tips in the period ────────────────────────────────────────────
    const tipsResult = await this.prisma.tip.aggregate({
      where: {
        tenantId,
        staffId: dto.staffId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      _sum: { amount: true },
    });
    const tipsEarned = Number(tipsResult._sum.amount ?? 0);

    // ── 4. Sum attendance hours in the period ────────────────────────────────
    const attendanceResult = await this.prisma.staffAttendance.aggregate({
      where: {
        tenantId,
        staffId: dto.staffId,
        clockIn: { gte: periodStart, lte: periodEnd },
        clockOut: { not: null },
      },
      _sum: { durationMin: true },
    });
    const hoursWorked = Number(attendanceResult._sum.durationMin ?? 0) / 60;

    // ── 5. Upsert the PayrollPeriod record ───────────────────────────────────
    const existing = await this.prisma.payrollPeriod.findFirst({
      where: {
        tenantId,
        staffId: dto.staffId,
        periodStart,
        periodEnd,
        ...(dto.outletId ? { outletId: dto.outletId } : {}),
      },
    });

    const payload = {
      totalServices,
      serviceRevenue,
      commissionEarned,
      tipsEarned,
      hoursWorked,
      notes: dto.notes ?? null,
      status: 'DRAFT',
    };

    if (existing) {
      return this.prisma.payrollPeriod.update({
        where: { id: existing.id },
        data: payload,
        include: { staff: { select: { id: true, name: true, role: true } } },
      });
    }

    return this.prisma.payrollPeriod.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        outletId: dto.outletId ?? null,
        periodStart,
        periodEnd,
        ...payload,
      },
      include: { staff: { select: { id: true, name: true, role: true } } },
    });
  }

  async getPayrollPeriods(staffId?: string, outletId?: string, status?: string) {
    const tenantId = this.tenantCtx.tenantId;
    const where: any = { tenantId };
    if (staffId) where.staffId = staffId;
    if (outletId) where.outletId = outletId;
    if (status) where.status = status;

    return this.prisma.payrollPeriod.findMany({
      where,
      include: { staff: { select: { id: true, name: true, role: true } } },
      orderBy: { periodStart: 'desc' },
    });
  }

  async approvePayroll(id: string, dto: ApprovePayrollDto) {
    const tenantId = this.tenantCtx.tenantId;
    const period = await this.prisma.payrollPeriod.findFirst({ where: { id, tenantId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === 'PAID') throw new ConflictException('Payroll already marked as PAID');

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: dto.status },
      include: { staff: { select: { id: true, name: true, role: true } } },
    });
  }

  // ─── Summary Report ─────────────────────────────────────────────────────────

  async getPayrollSummary(outletId?: string, from?: string, to?: string) {
    const tenantId = this.tenantCtx.tenantId;
    const where: any = { tenantId };
    if (outletId) where.outletId = outletId;
    if (from) where.periodStart = { gte: new Date(from) };
    if (to) where.periodEnd = { lte: new Date(to) };

    const periods = await this.prisma.payrollPeriod.findMany({
      where,
      include: { staff: { select: { id: true, name: true, role: true } } },
      orderBy: [{ staffId: 'asc' }, { periodStart: 'desc' }],
    });

    // Group by staff
    const byStaff: Record<string, any> = {};
    for (const p of periods) {
      if (!byStaff[p.staffId]) {
        byStaff[p.staffId] = {
          staffId: p.staffId,
          staffName: p.staff.name,
          role: p.staff.role,
          totalCommission: 0,
          totalTips: 0,
          totalHours: 0,
          totalRevenue: 0,
          periods: [],
        };
      }
      const entry = byStaff[p.staffId];
      entry.totalCommission += Number(p.commissionEarned);
      entry.totalTips += Number(p.tipsEarned);
      entry.totalHours += Number(p.hoursWorked);
      entry.totalRevenue += Number(p.serviceRevenue);
      entry.periods.push(p);
    }

    return Object.values(byStaff);
  }
}
