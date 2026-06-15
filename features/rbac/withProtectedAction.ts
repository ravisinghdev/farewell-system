import { createClient } from "@/lib/supabase/server";
import { AppPermission } from "./permissions";
import { AppRole } from "./roles";
import { hasPermission, hasRole } from "./guards";
import { cookies } from "next/headers";

export interface ProtectedActionOptions {
  requireAuth?: boolean; // Defaults to true
  requireOrgContext?: boolean; // Defaults to true
  allowedRoles?: AppRole[];
  requiredPermission?: AppPermission;
  logAction?: string; // e.g. "member.removed"
}

export interface ProtectedActionContext {
  user: any;
  organizationId: string | null;
  membershipId: string | null;
  role: AppRole | null;
}

export function withProtectedAction<TArgs extends any[], TReturn>(
  action: (context: ProtectedActionContext, ...args: TArgs) => Promise<TReturn>,
  options: ProtectedActionOptions = {}
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const {
      requireAuth = true,
      requireOrgContext = true,
      allowedRoles,
      requiredPermission,
      logAction,
    } = options;

    const supabase = await createClient();

    // 1. Authentication Validation
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (requireAuth && !user) {
      throw new Error("Unauthorized");
    }

    let organizationId: string | null = null;
    let membershipId: string | null = null;
    let role: AppRole | null = null;

    if (requireOrgContext && user) {
      // 2. Organization Validation
      const cookieStore = await cookies();
      organizationId = cookieStore.get("active_organization_id")?.value || null;

      if (!organizationId) {
        throw new Error("No active organization context found");
      }

      // 3. Membership Validation
      const { data: membership, error } = await supabase
        .from("organization_members")
        .select("id, role")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .single();

      if (error || !membership) {
        throw new Error("You do not have access to this organization");
      }

      membershipId = membership.id;
      role = membership.role as AppRole;

      // 4. Role Validation
      if (allowedRoles && allowedRoles.length > 0) {
        if (!hasRole(role, allowedRoles)) {
          throw new Error(`Forbidden: Requires one of [${allowedRoles.join(", ")}]`);
        }
      }

      // 5. Permission Validation
      if (requiredPermission) {
        if (!hasPermission(role, requiredPermission)) {
          throw new Error(`Forbidden: Requires permission '${requiredPermission}'`);
        }
      }
    }

    const context: ProtectedActionContext = {
      user,
      organizationId,
      membershipId,
      role,
    };

    // 6. Execute Action
    const result = await action(context, ...args);

    // 7. Activity Log
    if (logAction && organizationId && user) {
      await supabase.from("activity_logs").insert({
        organization_id: organizationId,
        actor_id: user.id,
        action: logAction,
        metadata: { args },
      } as any);
    }

    return result;
  };
}
