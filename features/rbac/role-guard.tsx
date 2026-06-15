"use client";

import { useOrganization } from "@/features/organizations/context/organization-context";
import { hasPermission, hasRole } from "./guards";
import { AppPermission } from "./permissions";
import { AppRole } from "./roles";

interface RoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: AppPermission;
}

export function RoleGuard({
  children,
  fallback = null,
  allowedRoles,
  requiredPermission,
}: RoleGuardProps) {
  const { role } = useOrganization();

  // If role is missing from context, they don't have access
  if (!role) {
    return <>{fallback}</>;
  }

  // 1. Check exact roles if provided
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(role, allowedRoles)) {
      return <>{fallback}</>;
    }
  }

  // 2. Check permission if provided
  if (requiredPermission) {
    if (!hasPermission(role, requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  // If we pass both checks (or no checks were provided), render children
  return <>{children}</>;
}
