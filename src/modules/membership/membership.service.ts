import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto, EnrollCustomerDto } from './dto/membership.dto';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  // ─── Plans ─────────────────────────────────────────────────────────────────

  async getPlans() {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.membershipPlan.findMany({
      where: { tenantId },
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPlan(id: string) {
    const tenantId = this.tenantCtx.tenantId;
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id, tenantId },
    });
    if (!plan) throw new NotFoundException(`Membership plan not found`);
    return plan;
  }

  async createPlan(dto: CreateMembershipPlanDto) {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.membershipPlan.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        duration: dto.duration,
        services: dto.services,
        isActive: true,
      },
    });
  }

  async updatePlan(id: string, dto: UpdateMembershipPlanDto) {
    await this.getPlan(id); // validates tenant scope
    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.services !== undefined && { services: dto.services }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deletePlan(id: string) {
    const tenantId = this.tenantCtx.tenantId;
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id, tenantId },
    });
    if (!plan) throw new NotFoundException(`Membership plan not found`);

    // Cancel active enrollments before deleting
    await this.prisma.membershipEnrollment.updateMany({
      where: { planId: id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    return this.prisma.membershipPlan.delete({ where: { id } });
  }

  // ─── Enrollments ───────────────────────────────────────────────────────────

  async getEnrollments(planId?: string, customerId?: string) {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.membershipEnrollment.findMany({
      where: {
        tenantId,
        ...(planId && { planId }),
        ...(customerId && { customerId }),
      },
      include: {
        plan: true,
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async enrollCustomer(dto: EnrollCustomerDto) {
    const tenantId = this.tenantCtx.tenantId;

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: dto.planId, tenantId, isActive: true },
    });
    if (!plan) throw new NotFoundException(`Membership plan not found or inactive`);

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException(`Customer not found`);

    // Calculate end date based on duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    switch (plan.duration) {
      case 'Quarterly':     endDate.setMonth(endDate.getMonth() + 3);  break;
      case 'Half-Yearly':   endDate.setMonth(endDate.getMonth() + 6);  break;
      case 'Annual':        endDate.setFullYear(endDate.getFullYear() + 1); break;
      default:              endDate.setMonth(endDate.getMonth() + 1);  // Monthly
    }

    // Expire any existing active enrollment for the same plan
    await this.prisma.membershipEnrollment.updateMany({
      where: { tenantId, planId: dto.planId, customerId: dto.customerId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    return this.prisma.membershipEnrollment.create({
      data: {
        tenantId,
        planId: dto.planId,
        customerId: dto.customerId,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async revokeEnrollment(enrollmentId: string) {
    const tenantId = this.tenantCtx.tenantId;
    const enrollment = await this.prisma.membershipEnrollment.findFirst({
      where: { id: enrollmentId, tenantId },
    });
    if (!enrollment) throw new NotFoundException(`Enrollment not found`);
    return this.prisma.membershipEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CANCELLED' },
    });
  }
}
