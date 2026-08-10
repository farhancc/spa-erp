import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from './features.decorator';
import { PrismaService } from '../database/prisma.service';
import { TenantContextService } from '../tenancy/tenant-context.service';

@Injectable()
export class FeaturesGuard implements CanActivate {
  private readonly cache = new Map<string, { planFeatures: Record<string, boolean>; expiresAt: number }>();

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @RequiresFeature() decorator -> allow
    if (!requiredFeature) return true;

    // Get tenant from context
    let tenantId: string | null = null;
    try {
      tenantId = this.tenantCtx.tenantId;
    } catch {
      // Context not initialized
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required for feature verification');
    }

    const now = Date.now();
    const cached = this.cache.get(tenantId);
    let planFeatures: Record<string, boolean>;

    if (cached && cached.expiresAt > now) {
      planFeatures = cached.planFeatures;
    } else {
      // Query tenant subscription and active plan
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

      if (!tenant) {
        throw new ForbiddenException('Tenant not found');
      }

      const plan = tenant.subscription?.plan;
      if (!plan) {
        throw new ForbiddenException('Active subscription plan required');
      }

      // Dynamically cache all boolean features of the plan
      planFeatures = {};
      for (const [key, val] of Object.entries(plan)) {
        if (typeof val === 'boolean') {
          planFeatures[key] = val;
        }
      }

      this.cache.set(tenantId, {
        planFeatures,
        expiresAt: now + 60000, // 60s TTL
      });
    }

    // Check if the specific feature is enabled on the plan
    const isEnabled = planFeatures[requiredFeature] === true;

    if (!isEnabled) {
      throw new ForbiddenException(`Feature '${requiredFeature}' is not enabled on your plan`);
    }

    return true;
  }
}
