import { Injectable, Scope } from '@nestjs/common';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

/**
 * REQUEST-scoped service — a new instance per HTTP request.
 * The TenantMiddleware populates this; all downstream services inject it.
 *
 * This is the single source of truth for the current tenant.
 * NEVER pass tenantId as a function argument between services — inject this.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private _tenantId: string;
  private _tenantSlug: string;

  set(ctx: TenantContext) {
    this._tenantId = ctx.tenantId;
    this._tenantSlug = ctx.tenantSlug;
  }

  get tenantId(): string {
    if (!this._tenantId) {
      throw new Error('TenantContext not initialized — check TenantMiddleware');
    }
    return this._tenantId;
  }

  get tenantSlug(): string {
    return this._tenantSlug;
  }
}
