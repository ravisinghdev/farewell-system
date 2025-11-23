"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { USER_ROLES, UserRole } from "@/lib/auth/roles";

export async function updateUserRoleAction(input: {
  targetUserId: string;
  role: UserRole;
}) {
  const current = await getCurrentUserWithRole();

  if (!current) return { error: "Not authenticated" };

  if (current.role !== "admin" && current.role !== "superadmin") {
    return { error: "Forbidden" };
  }

  if (!USER_ROLES.includes(input.role)) {
    return { error: "Invalid role" };
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    input.targetUserId,
    { user_metadata: { role: input.role } }
  );

  if (error) return { error: error.message };

  return { success: true };
}
