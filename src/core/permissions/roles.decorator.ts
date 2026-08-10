import { SetMetadata } from '@nestjs/common';
import { Role } from '../../shared/types/enums';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles.
 *
 * @example
 * @Roles(Role.OWNER, Role.MANAGER)
 * @Delete(':id')
 * delete() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
