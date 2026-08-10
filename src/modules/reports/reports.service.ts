import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  // ─── Summary ──────────────────────────────────────────────────────────────

  async getRevenueSummary(outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const [grossRevenue, visitsCount, activeBookingsCount, totalCustomers, topSpenders] =
      await Promise.all([
        // Gross Revenue (PAID invoices)
        this.prisma.invoice
          .aggregate({ 
            where: { tenantId, status: 'PAID', ...(outletId && { outletId }) }, 
            _sum: { totalAmount: true } 
          })
          .then((r) => r._sum.totalAmount ?? 0),

        // Total paid visits
        this.prisma.invoice.count({ 
          where: { tenantId, status: 'PAID', ...(outletId && { outletId }) } 
        }),

        // Active confirmed bookings
        this.prisma.booking.count({ 
          where: { tenantId, status: 'CONFIRMED', ...(outletId && { outletId }) } 
        }),

        // Total customers
        this.prisma.customer.count({ 
          where: { 
            tenantId,
            ...(outletId && {
              OR: [
                { preferredOutletId: outletId },
                { bookings: { some: { outletId } } }
              ]
            })
          } 
        }),

        // Top 5 spenders
        this.prisma.customer.findMany({
          where: { 
            tenantId,
            ...(outletId && {
              OR: [
                { preferredOutletId: outletId },
                { bookings: { some: { outletId } } }
              ]
            })
          },
          orderBy: { totalSpend: 'desc' },
          take: 5,
          select: { id: true, name: true, phone: true, totalSpend: true, totalVisits: true },
        }),
      ]);

    return { grossRevenue, visitsCount, activeBookingsCount, totalCustomers, topSpenders };
  }

  // ─── Daily Revenue (last N days) ─────────────────────────────────────────

  async getDailyRevenue(days = 30, outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: from },
        ...(outletId && { outletId }),
      },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date string YYYY-MM-DD
    const map = new Map<string, { revenue: number; count: number }>();
    for (const inv of invoices) {
      const key = inv.createdAt.toISOString().slice(0, 10);
      const prev = map.get(key) ?? { revenue: 0, count: 0 };
      map.set(key, { revenue: prev.revenue + Number(inv.totalAmount), count: prev.count + 1 });
    }

    // Fill in missing days with 0
    const result: { date: string; revenue: number; invoices: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = map.get(key) ?? { revenue: 0, count: 0 };
      result.push({ date: key, revenue: entry.revenue, invoices: entry.count });
    }

    return result;
  }

  // ─── Outlet Performance ───────────────────────────────────────────────────

  async getOutletPerformance() {
    const tenantId = this.tenantCtx.tenantId;

    const outlets = await this.prisma.outlet.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, city: true },
    });

    const results = await Promise.all(
      outlets.map(async (outlet) => {
        const [revenue, bookings, customers] = await Promise.all([
          this.prisma.invoice
            .aggregate({
              where: { tenantId, outletId: outlet.id, status: 'PAID' },
              _sum: { totalAmount: true },
            })
            .then((r) => Number(r._sum.totalAmount ?? 0)),

          this.prisma.booking.count({
            where: { tenantId, outletId: outlet.id, status: 'COMPLETED' },
          }),

          this.prisma.invoice.findMany({
            where: { tenantId, outletId: outlet.id, status: 'PAID' },
            distinct: ['customerId'],
            select: { customerId: true },
          }).then((r) => r.length),
        ]);

        return {
          outletId: outlet.id,
          outletName: outlet.name,
          city: outlet.city,
          revenue,
          completedBookings: bookings,
          uniqueCustomers: customers,
          avgRevenuePerBooking: bookings > 0 ? Math.round(revenue / bookings) : 0,
        };
      }),
    );

    return results.sort((a, b) => b.revenue - a.revenue);
  }

  // ─── Staff Performance ────────────────────────────────────────────────────

  async getStaffPerformance(outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const staff = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: ['STYLIST', 'RECEPTIONIST', 'MANAGER'] },
        ...(outletId && { outletId }),
      },
      select: { id: true, name: true, role: true, outletId: true },
    });

    const results = await Promise.all(
      staff.map(async (s) => {
        const [completedBookings, invoicesCreated] = await Promise.all([
          this.prisma.booking.count({
            where: { tenantId, staffId: s.id, status: 'COMPLETED', ...(outletId && { outletId }) },
          }),
          this.prisma.invoice
            .aggregate({
              where: { tenantId, createdById: s.id, status: 'PAID', ...(outletId && { outletId }) },
              _sum: { totalAmount: true },
              _count: { id: true },
            }),
        ]);

        const revenue = Number(invoicesCreated._sum.totalAmount ?? 0);
        const invoiceCount = invoicesCreated._count.id;

        return {
          staffId: s.id,
          staffName: s.name,
          role: s.role,
          outletId: s.outletId,
          completedBookings,
          invoicesCreated: invoiceCount,
          revenueGenerated: revenue,
          avgPerBooking: completedBookings > 0 ? Math.round(revenue / completedBookings) : 0,
        };
      }),
    );

    return results.sort((a, b) => b.completedBookings - a.completedBookings);
  }

  // ─── Service Popularity ───────────────────────────────────────────────────

  async getServicePopularity(limit = 10, outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const items = await this.prisma.invoiceItem.groupBy({
      by: ['serviceId'],
      where: {
        invoice: { 
          tenantId, 
          status: 'PAID',
          ...(outletId && { outletId })
        },
        serviceId: { not: null },
      },
      _count: { serviceId: true },
      _sum: { total: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: limit,
    });

    const serviceIds = items.map((i) => i.serviceId!).filter(Boolean);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });

    const serviceMap = new Map(services.map((s) => [s.id, s]));

    return items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: serviceMap.get(item.serviceId!)?.name ?? 'Unknown',
      timesBooked: item._count.serviceId,
      revenueGenerated: item._sum.total ?? 0,
    }));
  }

  // ─── Customer Retention ───────────────────────────────────────────────────

  async getRetentionStats(outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const [total, newCustomers, repeatCustomers, atRisk] = await Promise.all([
      this.prisma.customer.count({ 
        where: { 
          tenantId,
          ...(outletId && {
            OR: [
              { preferredOutletId: outletId },
              { bookings: { some: { outletId } } }
            ]
          })
        } 
      }),

      // New: only 1 visit
      this.prisma.customer.count({ 
        where: { 
          tenantId, 
          totalVisits: 1,
          ...(outletId && {
            OR: [
              { preferredOutletId: outletId },
              { bookings: { some: { outletId } } }
            ]
          })
        } 
      }),

      // Repeat: 2+ visits
      this.prisma.customer.count({ 
        where: { 
          tenantId, 
          totalVisits: { gte: 2 },
          ...(outletId && {
            OR: [
              { preferredOutletId: outletId },
              { bookings: { some: { outletId } } }
            ]
          })
        } 
      }),

      // At risk: visited before but not in last 60 days
      this.prisma.customer.count({
        where: {
          tenantId,
          totalVisits: { gte: 1 },
          lastVisitAt: {
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
          ...(outletId && {
            OR: [
              { preferredOutletId: outletId },
              { bookings: { some: { outletId } } }
            ]
          })
        },
      }),
    ]);

    return {
      totalCustomers: total,
      newCustomers,
      repeatCustomers,
      atRiskCustomers: atRisk,
      retentionRate: total > 0 ? Math.round((repeatCustomers / total) * 100) : 0,
    };
  }

  // ─── Booking Analytics ────────────────────────────────────────────────────

  async getBookingAnalytics(outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const [total, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.booking.count({ where: { tenantId, ...(outletId && { outletId }) } }),
      this.prisma.booking.count({ where: { tenantId, status: 'CONFIRMED', ...(outletId && { outletId }) } }),
      this.prisma.booking.count({ where: { tenantId, status: 'COMPLETED', ...(outletId && { outletId }) } }),
      this.prisma.booking.count({ where: { tenantId, status: 'CANCELLED', ...(outletId && { outletId }) } }),
      this.prisma.booking.count({ where: { tenantId, status: 'NO_SHOW', ...(outletId && { outletId }) } }),
    ]);

    return {
      total,
      confirmed,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    };
  }

  async getGstrReport(from?: Date | string, to?: Date | string, outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: fromDate, lte: toDate },
        ...(outletId && { outletId }),
      },
      include: {
        tenant: true,
        outlet: true,
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let totalGrossValue = 0;

    const b2bList: any[] = [];
    const b2cList: any[] = [];
    const hsnSummaryMap = new Map<string, {
      hsnSacCode: string;
      description: string;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalGst: number;
      totalValue: number;
    }>();

    for (const inv of invoices) {
      const invTotalTaxable = Number(inv.subtotal) - Number(inv.discountAmount) - Number(inv.loyaltyDiscount);
      const invGst = Number(inv.gstAmount);
      const invGross = Number(inv.totalAmount);

      const invCgst = invGst / 2;
      const invSgst = invGst / 2;
      const invIgst = 0;

      totalTaxableValue += invTotalTaxable;
      totalCgst += invCgst;
      totalSgst += invSgst;
      totalIgst += invIgst;
      totalGst += invGst;
      totalGrossValue += invGross;

      const invoiceRecord = {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.createdAt,
        outletName: inv.outlet.name,
        outletGstNumber: (inv as any).tenant.gstNumber || 'N/A',
        customerName: inv.customer.name,
        customerPhone: inv.customer.phone,
        customerGstin: inv.customer.gstin || '',
        taxableValue: invTotalTaxable,
        cgst: invCgst,
        sgst: invSgst,
        igst: invIgst,
        totalGst: invGst,
        totalValue: invGross,
      };

      if (inv.customer.gstin) {
        b2bList.push(invoiceRecord);
      } else {
        b2cList.push(invoiceRecord);
      }

      for (const item of inv.items) {
        const code = item.hsnSacCode || '998599';
        const qty = Number(item.quantity);
        const itemTaxable = (Number(item.unitPrice) * qty) - Number(item.discount);
        const itemGst = Number(item.gstAmount);
        const itemCgst = itemGst / 2;
        const itemSgst = itemGst / 2;
        const itemIgst = 0;
        const itemTotalVal = itemTaxable + itemGst;

        const prev = hsnSummaryMap.get(code) || {
          hsnSacCode: code,
          description: item.productId ? 'Products / Cosmetics' : 'Salon / Beauty Services',
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalGst: 0,
          totalValue: 0,
        };

        hsnSummaryMap.set(code, {
          hsnSacCode: code,
          description: prev.description,
          taxableValue: prev.taxableValue + itemTaxable,
          cgst: prev.cgst + itemCgst,
          sgst: prev.sgst + itemSgst,
          igst: prev.igst + itemIgst,
          totalGst: prev.totalGst + itemGst,
          totalValue: prev.totalValue + itemTotalVal,
        });
      }
    }

    return {
      summary: {
        totalTaxableValue,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGst,
        totalGrossValue,
        invoiceCount: invoices.length,
      },
      b2b: b2bList,
      b2c: b2cList,
      hsnSummary: Array.from(hsnSummaryMap.values()),
    };
  }

  async getRevenueForecast(outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const past30Days = new Date();
    past30Days.setDate(now.getDate() - 30);

    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        status: 'CONFIRMED',
        scheduledAt: { gte: now, lte: next30Days },
        ...(outletId && { outletId }),
      },
      include: {
        items: true,
      },
    });

    let projectedRevenue = 0;
    for (const b of upcomingBookings) {
      for (const item of b.items) {
        projectedRevenue += Number(item.price);
      }
    }

    const activeStaff = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'STAFF',
        deletedAt: null,
        ...(outletId && { outletId }),
      },
    });

    const pastBookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        scheduledAt: { gte: past30Days, lte: now },
        ...(outletId && { outletId }),
      },
      include: {
        items: true,
      },
    });

    let totalBookedMinutes = 0;
    for (const b of pastBookings) {
      for (const item of b.items) {
        const svc = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { duration: true },
        });
        totalBookedMinutes += svc?.duration ?? 30;
      }
    }

    const totalBookedHours = totalBookedMinutes / 60;
    const staffCount = Math.max(1, activeStaff.length);
    const totalAvailableHours = staffCount * 8 * 26;
    const seatUtilizationRate = Math.min(100, Math.round((totalBookedHours / totalAvailableHours) * 100));

    const customersWithBookings = await this.prisma.customer.findMany({
      where: {
        tenantId,
        bookings: { some: {} },
      },
      include: {
        bookings: {
          select: { status: true },
        },
      },
      take: 10,
    });

    const atRiskCustomers = customersWithBookings
      .map((c) => {
        const total = c.bookings.length;
        const noShows = c.bookings.filter((b) => b.status === 'NO_SHOW').length;
        const cancellations = c.bookings.filter((b) => b.status === 'CANCELLED').length;
        const probability = total > 0 ? Math.round(((noShows + 0.5 * cancellations) / total) * 100) : 0;

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalBookings: total,
          noShowCount: noShows,
          cancellationCount: cancellations,
          noShowProbability: probability,
        };
      })
      .filter((c) => c.noShowProbability > 20)
      .sort((a, b) => b.noShowProbability - a.noShowProbability);

    return {
      projectedRevenue,
      seatUtilizationRate,
      totalWorkingStylists: activeStaff.length,
      availableCapacityHours: totalAvailableHours,
      bookedCapacityHours: Math.round(totalBookedHours),
      atRiskCustomers,
    };
  }
}
