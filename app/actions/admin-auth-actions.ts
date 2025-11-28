/**
 * @fileoverview Server-side administration actions for updating user roles.
 *
 * This module provides secure server actions for administrative operations,
 * specifically user role management. All functions include authorization checks
 * to ensure only admins can perform these operations.
 *
 * @module app/actions/admin-auth-actions
 */

"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { USER_ROLES, UserRole } from "@/lib/auth/roles";

/**
 * Updates a user's role in the system (admin-only operation).
 *
 * This server action allows main_admin users to change another user's role.
 * The role is stored in the user's metadata and affects their permissions
 * throughout the application.
 *
 * **Authorization:**
 * - Requires caller to be authenticated
 * - Requires caller to have `main_admin` role
 *
 * **Security:**
 * - Uses Supabase Admin client to bypass RLS
 * - Validates role against allowed USER_ROLES
 * - Checks caller's permissions before executing
 *
 * @async
 * @param {Object} input - Update parameters
 * @param {string} input.targetUserId - ID of user whose role should be updated
 * @param {UserRole} input.role - New role to assign
 * @returns {Promise<{success?: boolean, error?: string}>} Result of the operation
 *
 * @example
 * // In a form submission handler
 * async function handleRoleChange(formData: FormData) {
 *   const result = await updateUserRoleAction({
 *     targetUserId: formData.get('userId') as string,
 *     role: formData.get('role') as UserRole,
 *   });
 *
 *   if (result.error) {
 *     toast(result.error);
 *   } else {
 *     toast.success('Role updated successfully');
 *   }
 * }
 *
 * @example
 * // Promote user to admin
 * const result = await updateUserRoleAction({
 *   targetUserId: 'user-abc-123',
 *   role: 'parallel_admin',
 * });
 */
export async function updateUserRoleAction(input: {
  targetUserId: string;
  role: UserRole;
}) {
  // Verify the caller is authenticated
  const current = await getCurrentUserWithRole();

  if (!current) return { error: "Not authenticated" };

  // Only main_admin can update user roles
  if (current.role !== "main_admin") {
    return { error: "Forbidden" };
  }

  // Validate the requested role
  if (!USER_ROLES.includes(input.role)) {
    return { error: "Invalid role" };
  }

  // Update the user's role in Supabase auth metadata
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    input.targetUserId,
    { user_metadata: { role: input.role } }
  );

  if (error) return { error: error.message };

  return { success: true };
}
