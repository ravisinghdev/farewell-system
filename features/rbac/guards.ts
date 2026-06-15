import { AppPermission } from "./permissions";
import { AppRole } from "./roles";
import { RoleMatrix } from "./role-matrix";

/**
 * Check if a user's role is exactly one of the allowed roles
 */
export function hasRole(userRole: string | null | undefined, allowedRoles: AppRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as AppRole);
}

/**
 * Check if a user's role possesses a specific permission
 */
export function hasPermission(userRole: string | null | undefined, requiredPermission: AppPermission): boolean {
  if (!userRole) return false;
  
  const rolePermissions = RoleMatrix[userRole as AppRole];
  if (!rolePermissions) return false;

  return rolePermissions.includes(requiredPermission);
}

/**
 * Enforces that a role matches the allowed roles. Throws if not.
 */
export function requireRole(userRole: string | null | undefined, allowedRoles: AppRole[]): void {
  if (!hasRole(userRole, allowedRoles)) {
    throw new Error(`Forbidden: Role ${userRole} is not in allowed list [${allowedRoles.join(", ")}]`);
  }
}

/**
 * Enforces that a role has the required permission. Throws if not.
 */
export function requirePermission(userRole: string | null | undefined, requiredPermission: AppPermission): void {
  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error(`Forbidden: Role ${userRole} is missing permission '${requiredPermission}'`);
  }
}
