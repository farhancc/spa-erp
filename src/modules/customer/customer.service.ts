import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { CustomerRepository } from './customer.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly tenantCtx: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const tenantId = this.tenantCtx.tenantId;

    // Check plan limits
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    const maxCustomers = tenant?.subscription?.plan?.maxCustomers ?? 500;
    const currentCustomers = await this.prisma.customer.count({ where: { tenantId } });
    if (currentCustomers >= maxCustomers) {
      throw new BadRequestException(
        `Limit exceeded: Your current plan allows a maximum of ${maxCustomers} customers. Please upgrade your subscription.`,
      );
    }

    // Check if phone already registered for this tenant
    const existing = await this.customerRepo.findByPhone(tenantId, dto.phone);
    if (existing) {
      throw new ConflictException(`Customer with phone number "${dto.phone}" already exists.`);
    }

    // Generate referral code: e.g. Customer Name uppercase + 4 random digits
    const namePart = dto.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
    const randomVal = Math.floor(1000 + Math.random() * 9000);
    const referralCode = `${namePart}${randomVal}`;

    let referredById: string | null = null;
    if (dto.referredByCode) {
      const referrer = await this.customerRepo.findByReferralCode(tenantId, dto.referredByCode);
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    const customer = await this.prisma.$transaction(async (tx) => {
      // 1. Create customer
      const cust = await tx.customer.create({
        data: {
          tenantId,
          outletId: dto.outletId || null,
          name: dto.name,
          phone: dto.phone,
          email: dto.email || null,
          gender: dto.gender || null,
          dob: dto.dob ? new Date(dto.dob) : null,
          notes: dto.notes || null,
          tags: dto.tags || null,
          preferredOutletId: dto.preferredOutletId || null,
          isBlocked: dto.isBlocked ?? false,
          passwordHash,
          totalVisits: dto.totalVisits ?? 0,
          totalSpend: dto.totalSpend ?? 0.0,
          referralCode,
          referredById,
        },
      });

      // 2. Find or create default active loyalty program
      let program = await tx.loyaltyProgram.findUnique({
        where: { tenantId },
      });
      if (!program) {
        program = await tx.loyaltyProgram.create({
          data: {
            tenantId,
            name: 'Premium Club Loyalty Points',
            pointsPerRupee: 1.0,
            rupeePerPoint: 0.5,
            minRedeemPoints: 100,
            maxRedeemPct: 0.2,
            isActive: true,
            signupPoints: 0,
            bookingPoints: 0,
          },
        });
      }

      if (program.isActive) {
        // Create customer loyalty account
        const account = await tx.loyaltyAccount.create({
          data: {
            tenantId,
            customerId: cust.id,
            programId: program.id,
            totalPoints: program.signupPoints || 0,
            lifetimeEarned: program.signupPoints || 0,
            lifetimeRedeemed: 0,
          },
        });

        if (program.signupPoints && program.signupPoints > 0) {
          // Record transaction
          await tx.loyaltyTransaction.create({
            data: {
              accountId: account.id,
              tenantId,
              type: 'EARN',
              points: program.signupPoints,
              description: 'Reward points for signing up',
            },
          });
        }
      }

      return cust;
    });

    return customer;
  }

  async findAll(options: { page?: number; limit?: number; search?: string; outletId?: string } = {}): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const result = await this.customerRepo.findByTenant(tenantId, options);
    result.data = result.data.map(c => ({
      ...c,
      loyaltyPoints: (c as any).loyaltyAccount?.totalPoints || 0,
    }));
    return result;
  }

  async findAllList(outletId?: string): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    const customers = await this.customerRepo.findAllByTenant(tenantId, outletId);
    return customers.map(c => ({
      ...c,
      loyaltyPoints: (c as any).loyaltyAccount?.totalPoints || 0,
    }));
  }

  async findOne(id: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const customer = await this.customerRepo.findById(id);

    if (!customer || customer.tenantId !== tenantId) {
      throw new NotFoundException(`Customer with ID "${id}" not found.`);
    }

    return {
      ...customer,
      loyaltyPoints: (customer as any).loyaltyAccount?.totalPoints || 0,
    };
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    // Validate existence and tenant scoping
    await this.findOne(id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.dob !== undefined) updateData.dob = dto.dob ? new Date(dto.dob) : null;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.preferredOutletId !== undefined) updateData.preferredOutletId = dto.preferredOutletId;
    if (dto.outletId !== undefined) updateData.outletId = dto.outletId || null;
    if (dto.isBlocked !== undefined) updateData.isBlocked = dto.isBlocked;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.totalVisits !== undefined) updateData.totalVisits = dto.totalVisits;
    if (dto.totalSpend !== undefined) updateData.totalSpend = dto.totalSpend;

    return this.customerRepo.update(id, updateData);
  }

  async getPortalDashboard(id: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const prisma = (this.customerRepo as any).prisma;

    // Fetch the customer first and ensure tenant matching
    const customer = await this.findOne(id);

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where: { customerId: id, tenantId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        staff: true,
        items: {
          include: {
            service: true
          }
        }
      }
    });

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where: { customerId: id, tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            service: true,
            product: true
          }
        }
      }
    });

    // Fetch gift cards
    const giftCards = await prisma.giftCard.findMany({
      where: { customerId: id, tenantId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch customer consents signed
    const consents = await prisma.customerConsent.findMany({
      where: { customerId: id, tenantId },
      orderBy: { signedAt: 'desc' },
      include: {
        template: true
      }
    });

    // Fetch loyalty account details & transactions list
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { customerId: id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Fetch count of referred customers
    const referredCount = await prisma.customer.count({
      where: { referredById: id, tenantId }
    });

    return {
      profile: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        dob: customer.dob,
        referralCode: customer.referralCode,
        referredCount,
        loyaltyPoints: loyaltyAccount?.totalPoints || 0,
        lifetimeEarned: loyaltyAccount?.lifetimeEarned || 0,
        lifetimeRedeemed: loyaltyAccount?.lifetimeRedeemed || 0
      },
      bookings,
      invoices,
      giftCards,
      consents,
      loyaltyTransactions: loyaltyAccount?.transactions || []
    };
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.customerRepo.delete(id);
  }

  // ─── CUSTOMER SEGMENTS ───
  async createSegment(dto: any): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.customerSegment.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        criteriaType: dto.criteriaType,
        criteriaValue: String(dto.criteriaValue),
      },
    });
  }

  async findSegments(): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.customerSegment.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async removeSegment(id: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.customerSegment.deleteMany({
      where: { id, tenantId },
    });
  }

  async findSegmentMembers(segmentId: string): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    const segment = await this.prisma.customerSegment.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      throw new NotFoundException(`Customer Segment with ID "${segmentId}" not found.`);
    }

    const value = segment.criteriaValue;
    const where: any = { tenantId };

    switch (segment.criteriaType) {
      case 'LAST_VISIT': {
        const days = parseInt(value, 10) || 60;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);
        where.OR = [
          { lastVisitAt: { lt: thresholdDate } },
          { lastVisitAt: null },
        ];
        break;
      }
      case 'MIN_SPEND': {
        const minSpend = parseFloat(value) || 0.0;
        where.totalSpend = { gte: minSpend };
        break;
      }
      case 'MIN_VISITS': {
        const minVisits = parseInt(value, 10) || 0;
        where.totalVisits = { gte: minVisits };
        break;
      }
      case 'TAG': {
        where.tags = { contains: value };
        break;
      }
      default:
        break;
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }
}
