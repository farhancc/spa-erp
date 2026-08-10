import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../database/prisma.service';
import { TenantContextService } from './tenant-context.service';

/**
 * Resolves the tenant from the subdomain on every request.
 *
 * Strategy:
 *   - Production: cutsalon.careva.in  → slug = "cutsalon"
 *   - Dev (lvh.me): cutsalon.lvh.me:3000 → slug = "cutsalon"
 *   - Fallback header: X-Tenant-Slug (useful for Postman/testing)
 *   - /superadmin routes skip tenant resolution
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Skip for super-admin routes
    if (req.originalUrl.startsWith('/api/v1/superadmin') || req.originalUrl.startsWith('/superadmin')) {
      return next();
    }

    const slug = this.resolveSlug(req);
    if (!slug) return next(); // public routes without subdomain

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }

    this.tenantCtx.set({ tenantId: tenant.id, tenantSlug: tenant.slug });
    next();
  }

  private resolveSlug(req: Request): string | null {
    // Header override (dev/testing)
    const headerSlug = req.headers['x-tenant-slug'] as string;
    if (headerSlug) return headerSlug;

    // Extract subdomain
    const host = req.hostname; // e.g. "cutsalon.lvh.me" or "cutsalon.careva.in"
    
    // Ignore IP addresses and localhost
    if (/^[0-9.]+$/.test(host) || host === '::1' || host === 'localhost') {
      return null;
    }

    const parts = host.split('.');
    if (parts.length >= 2) {
      const sub = parts[0];
      // Ignore www and bare domain
      if (sub !== 'www' && sub !== 'careva' && sub !== 'localhost') {
        return sub;
      }
    }

    return null;
  }
}
