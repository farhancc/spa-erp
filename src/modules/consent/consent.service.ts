import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  // ─── Consent Templates ─────────────────────────────────────────────────────

  async createTemplate(dto: {
    serviceCategoryId?: string;
    title: string;
    content: string;
  }) {
    const tenantId = this.tenantCtx.tenantId;

    return this.prisma.consentTemplate.create({
      data: {
        tenantId,
        serviceCategoryId: dto.serviceCategoryId || null,
        title: dto.title,
        content: dto.content,
        isActive: true,
      },
    });
  }

  async getTemplates(serviceCategoryId?: string) {
    const tenantId = this.tenantCtx.tenantId;

    return this.prisma.consentTemplate.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(serviceCategoryId && { serviceCategoryId }),
      },
      include: {
        serviceCategory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Customer Signed Consents ──────────────────────────────────────────────

  async signConsent(dto: {
    customerId: string;
    templateId: string;
    bookingId?: string;
    signatureUrl?: string;
    signatureText?: string;
    ipAddress?: string;
  }) {
    const tenantId = this.tenantCtx.tenantId;

    // Verify template existence
    const template = await this.prisma.consentTemplate.findFirst({
      where: { id: dto.templateId, tenantId },
    });
    if (!template) {
      throw new NotFoundException(`Consent template with ID "${dto.templateId}" not found.`);
    }

    // Verify customer existence
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${dto.customerId}" not found.`);
    }

    return this.prisma.customerConsent.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        templateId: dto.templateId,
        bookingId: dto.bookingId || null,
        signatureUrl: dto.signatureUrl || null,
        signatureText: dto.signatureText || null,
        ipAddress: dto.ipAddress || null,
      },
      include: {
        template: true,
        booking: true,
      },
    });
  }

  async getCustomerConsentHistory(customerId: string) {
    const tenantId = this.tenantCtx.tenantId;

    return this.prisma.customerConsent.findMany({
      where: {
        tenantId,
        customerId,
      },
      include: {
        template: {
          include: {
            serviceCategory: true,
          },
        },
        booking: true,
      },
      orderBy: { signedAt: 'desc' },
    });
  }
}
