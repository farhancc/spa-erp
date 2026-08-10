import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class CmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWebsiteByTenant(tenantId: string) {
    return this.prisma.website.findUnique({
      where: { tenantId },
      include: {
        pages: {
          include: {
            sections: true,
          },
        },
      },
    });
  }

  async createWebsite(tenantId: string, template: string) {
    return this.prisma.website.create({
      data: {
        tenantId,
        template,
        primaryColor: '#0f172a',
        secondaryColor: '#f43f5e',
        fontFamily: 'Inter',
        isPublished: true,
      },
    });
  }

  async saveWebsiteConfig(
    websiteId: string,
    dto: {
      template?: string;
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      isPublished?: boolean;
      useCustomCode?: boolean;
      customHtml?: string;
      customCss?: string;
      customJs?: string;
    },
  ) {
    const updateData: any = {};
    if (dto.template !== undefined) updateData.template = dto.template;
    if (dto.primaryColor !== undefined) updateData.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) updateData.secondaryColor = dto.secondaryColor;
    if (dto.fontFamily !== undefined) updateData.fontFamily = dto.fontFamily;
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;
    if (dto.useCustomCode !== undefined) updateData.useCustomCode = dto.useCustomCode;
    if (dto.customHtml !== undefined) updateData.customHtml = dto.customHtml;
    if (dto.customCss !== undefined) updateData.customCss = dto.customCss;
    if (dto.customJs !== undefined) updateData.customJs = dto.customJs;
    return this.prisma.website.update({
      where: { id: websiteId },
      data: updateData,
    });
  }

  async findWebsiteByTenantSlug(tenantSlug: string) {
    return this.prisma.website.findFirst({
      where: { tenant: { slug: tenantSlug } },
      select: {
        useCustomCode: true,
        customHtml: true,
        customCss: true,
        customJs: true,
        template: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });
  }

  async getPublicTenantData(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true },
    });
    if (!tenant) return null;

    const [services, users, outlets] = await Promise.all([
      this.prisma.service.findMany({
        where: { tenantId: tenant.id, deletedAt: null, isActive: true },
        select: {
          id: true, name: true, description: true, duration: true,
          price: true, offerPrice: true, gender: true, bodyPart: true,
          images: true, imageUrl: true, tags: true, loyaltyPoints: true,
          category: { select: { name: true } },
        },
        orderBy: { sortOrder: 'asc' },
        take: 50,
      }),
      this.prisma.user.findMany({
        where: { tenantId: tenant.id, role: 'STYLIST', isActive: true, deletedAt: null },
        select: {
          id: true, name: true, outletId: true,
          staffProfile: { select: { specializations: true, rating: true, totalRatings: true } },
        },
        take: 30,
      }),
      this.prisma.outlet.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, name: true, address: true, phone: true, slug: true },
        orderBy: { isDefault: 'desc' },
        take: 20,
      }),
    ]);

    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenantSlug },
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        offerPrice: s.offerPrice !== null && s.offerPrice !== undefined ? Number(s.offerPrice) : null,
        gender: s.gender,
        bodyPart: s.bodyPart,
        images: s.images,
        imageUrl: s.imageUrl ?? '',
        tags: s.tags,
        loyaltyPoints: s.loyaltyPoints ?? 0,
        category: s.category?.name ?? 'General',
      })),
      stylists: users.map((u) => ({
        id: u.id,
        name: u.name,
        outletId: u.outletId,
        specialty: u.staffProfile?.specializations ?? 'Stylist',
        rating: u.staffProfile?.rating ?? 5.0,
        totalRatings: u.staffProfile?.totalRatings ?? 0,
        avatar: u.name.split(' ').map((n) => n[0]).join('').toUpperCase(),
      })),
      outlets: outlets.map((o) => ({
        id: o.id,
        name: o.name,
        address: o.address,
        phone: o.phone,
        slug: o.slug,
      })),
    };
  }

  async upsertPage(websiteId: string, title: string, slug: string, outletId?: string) {
    const existing = await this.prisma.websitePage.findFirst({
      where: { websiteId, slug },
    });

    if (existing) {
      return this.prisma.websitePage.update({
        where: { id: existing.id },
        data: { title, outletId },
      });
    }

    return this.prisma.websitePage.create({
      data: {
        websiteId,
        title,
        slug,
        outletId,
        isPublished: true,
      },
    });
  }

  async savePageSections(pageId: string, sections: Array<{ type: string; data: string; sortOrder: number }>) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete existing sections
      await tx.websiteSection.deleteMany({
        where: { pageId },
      });

      // 2. Insert new sections
      const creations = sections.map((sec) =>
        tx.websiteSection.create({
          data: {
            pageId,
            type: sec.type,
            data: sec.data,
            sortOrder: sec.sortOrder,
            isEnabled: true,
          },
        }),
      );
      return Promise.all(creations);
    });
  }
}
