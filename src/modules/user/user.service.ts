import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuthUser } from '../../core/auth/current-user.decorator';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tenantCtx: TenantContextService,
    private readonly prisma: PrismaService,
  ) { }

  async create(dto: CreateUserDto): Promise<User> {
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

    const maxStaff = tenant?.subscription?.plan?.maxStaff ?? 5;
    const currentStaff = await this.prisma.user.count({ where: { tenantId, deletedAt: null } });
    if (currentStaff >= maxStaff) {
      throw new BadRequestException(
        `Limit exceeded: Your current plan allows a maximum of ${maxStaff} staff members. Please upgrade your subscription.`,
      );
    }

    const existing = await this.userRepo.findByEmail(tenantId, dto.email);
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists.`);
    }

    if (!dto.password) {
      throw new BadRequestException('Password is required.');
    }

    let passwordHash = dto.password;
    if (!passwordHash.startsWith('$2b$')) {
      passwordHash = await bcrypt.hash(passwordHash, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          tenantId,
          outletId: dto.outletId || null,
          name: dto.name,
          email: dto.email,
          phone: dto.phone || '',
          passwordHash,
          role: dto.role || 'STYLIST',
          isActive: dto.isActive ?? true,
        },
      });

      if (createdUser.role === 'STYLIST') {
        await tx.staffProfile.create({
          data: {
            userId: createdUser.id,
            specializations: dto.specialization || 'Stylist',
            rating: 5.0,
            totalRatings: 0,
            workingDays: dto.workingDays ?? [1, 2, 3, 4, 5, 6],
          },
        });
      }

      return createdUser;
    });
  }

  async findAll(options: { page?: number; limit?: number; search?: string; role?: string; outletId?: string } = {}): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.userRepo.findByTenant(tenantId, options);
  }

  async findAllList(outletId?: string): Promise<User[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.userRepo.findAllByTenant(tenantId, outletId);
  }

  async findOne(id: string): Promise<User> {
    const tenantId = this.tenantCtx.tenantId;
    const user = await this.userRepo.findById(id);

    if (!user || user.tenantId !== tenantId || user.deletedAt) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // validates tenant scope

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.outletId !== undefined) updateData.outletId = dto.outletId || null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      if (dto.role === 'STYLIST' || updatedUser.role === 'STYLIST') {
        const existingProfile = await tx.staffProfile.findUnique({
          where: { userId: id },
        });

        if (!existingProfile) {
          await tx.staffProfile.create({
            data: {
              userId: id,
              specializations: dto.specialization || 'Stylist',
              rating: 5.0,
              totalRatings: 0,
              workingDays: dto.workingDays ?? [1, 2, 3, 4, 5, 6],
            },
          });
        } else {
          const profileUpdate: any = {};
          if (dto.specialization !== undefined) profileUpdate.specializations = dto.specialization;
          if (dto.workingDays !== undefined) profileUpdate.workingDays = dto.workingDays;
          if (Object.keys(profileUpdate).length > 0) {
            await tx.staffProfile.update({
              where: { userId: id },
              data: profileUpdate,
            });
          }
        }
      }

      return updatedUser;
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepo.update(id, { deletedAt: new Date() } as any);
  }

  async createLeave(dto: { staffId: string; startDate: Date; endDate: Date; reason?: string }): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.staffLeave.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: 'APPROVED',
        reason: dto.reason,
      },
    });
  }

  async findLeaves(query: { staffId?: string; from?: string; to?: string }): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    const where: any = { tenantId };
    if (query.staffId) where.staffId = query.staffId;
    // Use overlap logic: leave overlaps range if startDate <= to AND endDate >= from
    if (query.from || query.to) {
      if (query.to) where.startDate = { lte: new Date(query.to) };
      if (query.from) where.endDate = { gte: new Date(query.from) };
    }
    return this.prisma.staffLeave.findMany({
      where,
      include: { staff: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async deleteLeave(id: string, currentUser: AuthUser): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const leave = await this.prisma.staffLeave.findFirst({
      where: { id, tenantId },
    });
    if (!leave) throw new NotFoundException('Leave not found');

    if (currentUser.role === 'STYLIST' && leave.staffId !== currentUser.id) {
      throw new ForbiddenException('Stylists can only cancel their own leaves');
    }

    return this.prisma.staffLeave.delete({ where: { id } });
  }

  async createBlockedSlot(dto: { staffId: string; outletId: string; scheduledAt: Date; endsAt: Date; reason?: string }): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.prisma.staffBlockSlot.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        outletId: dto.outletId,
        scheduledAt: new Date(dto.scheduledAt),
        endsAt: new Date(dto.endsAt),
        reason: dto.reason,
      },
    });
  }

  async findBlockedSlots(query: { staffId?: string; outletId?: string; from?: string; to?: string }): Promise<any[]> {
    const tenantId = this.tenantCtx.tenantId;
    const where: any = { tenantId };
    if (query.staffId) where.staffId = query.staffId;
    if (query.outletId) where.outletId = query.outletId;
    if (query.from || query.to) {
      where.scheduledAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }
    return this.prisma.staffBlockSlot.findMany({
      where,
      include: { staff: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async deleteBlockedSlot(id: string, currentUser: AuthUser): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const slot = await this.prisma.staffBlockSlot.findFirst({
      where: { id, tenantId },
    });
    if (!slot) throw new NotFoundException('Blocked slot not found');

    if (currentUser.role === 'STYLIST' && slot.staffId !== currentUser.id) {
      throw new ForbiddenException('Stylists can only unblock their own slots');
    }

    return this.prisma.staffBlockSlot.delete({ where: { id } });
  }
}
