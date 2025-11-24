/**
 * @fileoverview Current user session management with role information.
 *
 * This module provides utilities for retrieving the currently authenticated user
 * along with their role information from the database. It combines Supabase auth
 * session data with application-specific role data.
 *
 * @module lib/auth/current-user
 */

import { createClient } from "@/utils/supabase/server";
import { getUserRoleFromDb, type UserRoleName } from "./roles-db";

/**
 * Authenticated user object with role information.
 *
 * This interface extends the basic Supabase user data with application-specific
 * role information, providing a complete picture of the user's identity and permissions.
 *
 * @interface AuthUserWithRole
 * @property {string} id - Unique user identifier (matches Supabase auth.users.id)
 * @property {string} email - User's email address
 * @property {UserRoleName} role - User's assigned role (student, teacher, parallel_admin, main_admin)
 * @property {any} raw - Raw Supabase user object for accessing additional metadata
 */
export interface AuthUserWithRole {
  id: string;
  email: string;
  role: UserRoleName;
  raw: any;
}

/**
 * Retrieves the currently authenticated user with their role information.
 *
 * This function:
 * 1. Gets the current user session from Supabase
 * 2. Fetches the user's role from the database
 * 3. Combines both into a single AuthUserWithRole object
 *
 * **Usage in Server Components:**
 * ```tsx
 * export default async function ProtectedPage() {
 *   const user = await getCurrentUserWithRole();
 *   if (!user) redirect('/auth');
 *
 *   if (user.role === 'main_admin') {
 *     return <AdminDashboard />;
 *   }
 *   return <UserDashboard />;
 * }
 * ```
 *
 * **Usage in Server Actions:**
 * ```ts
 * export async function updateSettingsAction(data: FormData) {
 *   const user = await getCurrentUserWithRole();
 *   if (!user) return { error: 'Unauthorized' };
 *
 *   // Proceed with action...
 * }
 * ```
 *
 * @async
 * @returns {Promise<AuthUserWithRole | null>} User with role info, or null if not authenticated
 *
 * @example
 * // Check if user is logged in
 * const user = await getCurrentUserWithRole();
 * if (!user) {
 *   // User not authenticated
 *   redirect('/auth');
 * }
 *
 * @example
 * // Check user's role
 * const user = await getCurrentUserWithRole();
 * if (user?.role === 'main_admin') {
 *   // User has admin privileges
 * }
 */
export async function getCurrentUserWithRole(): Promise<AuthUserWithRole | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) return null;

  const user = data.user;
  const role = await getUserRoleFromDb(user.id);

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    raw: user,
  };
}
