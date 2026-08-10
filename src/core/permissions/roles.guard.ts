import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../shared/types/enums';
import { ROLES_KEY } from './roles.decorator';

/**
 * Role hierarchy: SUPER_ADMIN > OWNER > MANAGER > RECEPTIONIST > STYLIST
 *
 * If @Roles() is not set on a route, any authenticated user passes.
 * If @Roles() is set, the user must have one of the listed roles.
 *
 * SUPER_ADMIN always passes all role checks.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.OWNER]: 80,
  [Role.MANAGER]: 60,
  [Role.RECEPTIONIST]: 40,
  [Role.STYLIST]: 20,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → any authenticated user allowed
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // SUPER_ADMIN bypasses all role checks
    if (user.role === Role.SUPER_ADMIN) return true;

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
