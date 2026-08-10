import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Outlet, OutletTiming } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { OutletRepository } from './outlet.repository';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { UpsertOutletTimingDto } from './dto/upsert-outlet-timing.dto';
import { PaginatedResult, PaginationOptions } from '../../shared/base/base.repository';

@Injectable()
export class OutletService {
  constructor(
    private readonly outletRepo: OutletRepository,
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateOutletDto): Promise<Outlet> {
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

    const maxOutlets = tenant?.subscription?.plan?.maxOutlets ?? 1;
    const currentOutlets = await this.outletRepo.count({ tenantId });
    if (currentOutlets >= maxOutlets) {
      throw new BadRequestException(
        `Limit exceeded: Your current plan allows a maximum of ${maxOutlets} outlets. Please upgrade your subscription.`,
      );
    }

    // Auto-generate slug from name if not provided
    const slug = dto.slug ?? this.slugify(dto.name);

    // Check slug uniqueness within tenant
    const existing = await this.outletRepo.findBySlug(tenantId, slug);
    if (existing) {
      throw new ConflictException(`Outlet slug '${slug}' is already in use`);
    }

    // If this outlet is marked as default, clear existing default first
    if (dto.isDefault) {
      await this.outletRepo.clearDefaultOutlet(tenantId);
    }

    // If this is the first outlet for the tenant, make it the default
    const count = await this.outletRepo.count({ tenantId });

    return this.outletRepo.create({
      tenantId,
      name: dto.name,
      slug,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      isDefault: dto.isDefault ?? count === 0, // auto-default if first
      isActive: true,
    });
  }

  async findAll(options: PaginationOptions & { activeOnly?: boolean } = {}): Promise<PaginatedResult<Outlet>> {
    return this.outletRepo.findByTenant(this.tenantCtx.tenantId, options);
  }

  async findOne(id: string): Promise<Outlet> {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, tenantId: this.tenantCtx.tenantId },
      include: {
        timings: { orderBy: { dayOfWeek: 'asc' } },
      },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    return outlet;
  }

  async update(id: string, dto: UpdateOutletDto): Promise<Outlet> {
    await this.findOne(id); // validates tenancy + existence

    const tenantId = this.tenantCtx.tenantId;

    // If updating slug, check for conflicts
    if (dto.slug) {
      const existing = await this.outletRepo.findBySlug(tenantId, dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Outlet slug '${dto.slug}' is already in use`);
      }
    }

    // If setting this outlet as default, clear existing first
    if (dto.isDefault) {
      await this.outletRepo.clearDefaultOutlet(tenantId);
    }

    return this.outletRepo.update(id, dto as any);
  }

  async remove(id: string): Promise<void> {
    const outlet = await this.findOne(id);

    // Prevent deleting the only / default outlet
    const count = await this.outletRepo.count({ tenantId: this.tenantCtx.tenantId });
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the only outlet. Add another outlet first.');
    }

    if (outlet.isDefault) {
      throw new BadRequestException('Cannot delete the default outlet. Set another outlet as default first.');
    }

    await this.outletRepo.delete(id);
  }

  // ─── Timings ──────────────────────────────────────────────────────────────

  async upsertTiming(outletId: string, dto: UpsertOutletTimingDto): Promise<OutletTiming> {
    await this.findOne(outletId); // tenancy check
    return this.outletRepo.upsertTiming(outletId, dto.dayOfWeek, {
      openTime: dto.openTime,
      closeTime: dto.closeTime,
      isClosed: dto.isClosed ?? false,
    });
  }

  async getTimings(outletId: string): Promise<OutletTiming[]> {
    await this.findOne(outletId); // tenancy check
    return this.outletRepo.getTimings(outletId);
  }

  async setDefaultOutlet(id: string): Promise<Outlet> {
    await this.findOne(id); // tenancy check
    await this.outletRepo.clearDefaultOutlet(this.tenantCtx.tenantId);
    return this.outletRepo.update(id, { isDefault: true });
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
