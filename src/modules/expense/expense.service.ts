import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async createExpense(dto: {
    outletId?: string;
    category: string;
    amount: number;
    description?: string;
    spentAt: Date | string;
    receiptUrl?: string;
  }) {
    const tenantId = this.tenantCtx.tenantId;

    return this.prisma.expense.create({
      data: {
        tenantId,
        outletId: dto.outletId || null,
        category: dto.category,
        amount: dto.amount,
        description: dto.description || null,
        spentAt: new Date(dto.spentAt),
        receiptUrl: dto.receiptUrl || null,
      },
    });
  }

  async getExpenses(options: { outletId?: string; category?: string } = {}) {
    const tenantId = this.tenantCtx.tenantId;

    return this.prisma.expense.findMany({
      where: {
        tenantId,
        ...(options.outletId && { outletId: options.outletId }),
        ...(options.category && { category: options.category }),
      },
      include: {
        outlet: true,
      },
      orderBy: { spentAt: 'desc' },
    });
  }

  async getNetProfitReport(from?: Date | string, to?: Date | string, outletId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    // 1. Gross Revenue (Total Paid Invoices)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: fromDate, lte: toDate },
        ...(outletId && { outletId }),
      },
      include: {
        items: true,
      },
    });

    let totalRevenue = 0;
    let totalProductSales = 0;
    for (const inv of invoices) {
      totalRevenue += Number(inv.totalAmount);
      for (const item of inv.items) {
        if (item.productId) {
          totalProductSales += Number(item.total);
        }
      }
    }

    // 2. COGS (Cost of Goods Sold - assumed 40% margin on products)
    const totalCogs = totalProductSales * 0.40;

    // 3. Operational Expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        tenantId,
        spentAt: { gte: fromDate, lte: toDate },
        ...(outletId && { outletId }),
      },
    });

    let operationalExpenses = 0;
    const categoryTotals = new Map<string, number>();

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      operationalExpenses += amt;

      const prev = categoryTotals.get(exp.category) ?? 0;
      categoryTotals.set(exp.category, prev + amt);
    }

    // 4. Staff Commissions / Payroll Disbursements
    const payrolls = await this.prisma.payrollPeriod.findMany({
      where: {
        tenantId,
        periodStart: { gte: fromDate },
        periodEnd: { lte: toDate },
        ...(outletId && { outletId }),
      },
    });

    let staffPayrollCost = 0;
    for (const pr of payrolls) {
      staffPayrollCost += Number(pr.commissionEarned) + Number(pr.tipsEarned);
    }

    // Net Profit calculation
    const totalOutflow = totalCogs + operationalExpenses + staffPayrollCost;
    const netProfit = totalRevenue - totalOutflow;

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      revenue: {
        totalRevenue,
        productSalesRevenue: totalProductSales,
        serviceSalesRevenue: totalRevenue - totalProductSales,
      },
      outflows: {
        totalOutflow,
        costOfGoodsSold: totalCogs,
        operationalExpenses,
        staffPayrollCost,
      },
      netProfit,
      marginPercentage: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
      expenseBreakdown: Array.from(categoryTotals.entries()).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  }
}
