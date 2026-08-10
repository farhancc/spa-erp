import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user from the request.
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: AuthUser) { ... }
 *
 * @example — get specific field
 * @Get('bookings')
 * list(@CurrentUser('tenantId') tenantId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);

export interface AuthUser {
  id: string;
  tenantId: string;
  outletId: string | null;
  role: string;
  name: string;
  isActive: boolean;
}
