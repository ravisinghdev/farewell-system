/**
 * @fileoverview User claims management for farewell-specific roles and permissions.
 *
 * This module handles custom claims stored in Supabase `app_metadata`, particularly
 * farewell-specific roles. Claims are used for fast authorization checks in middleware
 * without requiring database queries.
 *
 * **Performance Benefits:**
 * - Claims are embedded in JWT tokens (2-5ms access time)
 * - No database roundtrip needed for role checks
 * - Ideal for middleware and edge functions
 *
 * @module lib/auth/claims
 */

import { Session, User } from "@supabase/supabase-js";

/**
 * Role within a specific farewell context.
 *
 * Each farewell can assign different roles to users, allowing for
 * granular permission control across multiple farewells.
 *
 * @typedef {("student" | "teacher" | "parallel_admin" | "main_admin")} FarewellRole
 */
export type FarewellRole =
  | "student"
  | "teacher"
  | "parallel_admin"
  | "main_admin";

/**
 * Mapping of farewell IDs to user roles within those farewells.
 *
 * Example structure:
 * ```json
 * {
 *   "farewell-abc-123": "student",
 *   "farewell-xyz-456": "main_admin"
 * }
 * ```
 *
 * @interface FarewellClaims
 * @property {FarewellRole} [farewellId] - Role for a specific farewell (indexed by farewell ID)
 */
export interface FarewellClaims {
  [farewellId: string]: FarewellRole;
}

/**
 * Custom claims stored in user's app_metadata.
 *
 * These claims are embedded in the JWT token and can be accessed without
 * database queries, making them ideal for fast authorization checks.
 *
 * @interface UserClaims
 * @property {FarewellClaims} [farewells] - Map of farewell IDs to roles
 * @property {any} [key] - Additional custom metadata fields
 */
export interface UserClaims {
  farewells?: FarewellClaims;
  [key: string]: any;
}

/**
 * Extracts custom claims from the user's app_metadata.
 *
 * This function is the primary entry point for accessing user claims,
 * which are stored in Supabase's `app_metadata` field and embedded in JWT tokens.
 *
 * **Use Cases:**
 * - Fast role checks in middleware
 * - Authorization without database queries
 * - Edge function permission checks
 *
 * @param {User | null} user - Supabase user object (from session or auth.getUser())
 * @returns {UserClaims} User's custom claims, or empty object if not available
 *
 * @example
 * // In middleware
 * const { data: { user } } = await supabase.auth.getUser();
 * const claims = getClaims(user);
 * if (claims.farewells?.['farewell-123'] === 'main_admin') {
 *   // User is admin of this farewell
 * }
 */
export function getClaims(user: User | null): UserClaims {
  if (!user || !user.app_metadata) return {};
  return user.app_metadata as UserClaims;
}

/**
 * Gets the user's role for a specific farewell.
 *
 * This function provides a convenient way to check if a user is part of a specific
 * farewell and what role they have within it.
 *
 * @param {User | null} user - Supabase user object
 * @param {string} farewellId - ID of the farewell to check
 * @returns {FarewellRole | null} User's role in the farewell, or null if not a member
 *
 * @example
 * // Check if user can manage a farewell
 * const role = getFarewellRole(user, 'farewell-123');
 * if (role === 'main_admin' || role === 'parallel_admin') {
 *   // User can modify farewell settings
 * }
 *
 * @example
 * // Check if user is a member
 * if (getFarewellRole(user, farewellId)) {
 *   // User has access to this farewell
 * } else {
 *   // User is not a member
 * }
 */
export function getFarewellRole(
  user: User | null,
  farewellId: string
): FarewellRole | null {
  const claims = getClaims(user);
  if (!claims.farewells) return null;
  return claims.farewells[farewellId] || null;
}

/**
 * Checks if the user is a member of any farewell.
 *
 * Useful for determining if a user should be redirected to the welcome page
 * or to a farewell dashboard.
 *
 * @param {User | null} user - Supabase user object
 * @returns {boolean} True if user is member of at least one farewell
 *
 * @example
 * // Redirect logic
 * if (hasAnyFarewell(user)) {
 *   redirect('/dashboard');
 * } else {
 *   redirect('/welcome');
 * }
 */
export function hasAnyFarewell(user: User | null): boolean {
  const claims = getClaims(user);
  return !!claims.farewells && Object.keys(claims.farewells).length > 0;
}

/**
 * Gets the first available farewell ID from the user's claims.
 *
 * Useful for default redirects when a user has multiple farewells.
 * The order is not guaranteed, so this should only be used when any
 * farewell is acceptable.
 *
 * @param {User | null} user - Supabase user object
 * @returns {string | null} First farewell ID, or null if user has no farewells
 *
 * @example
 * // Default dashboard redirect
 * const farewellId = getFirstFarewellId(user);
 * if (farewellId) {
 *   redirect(`/dashboard/${farewellId}`);
 * }
 */
export function getFirstFarewellId(user: User | null): string | null {
  const claims = getClaims(user);
  if (!claims.farewells) return null;
  const ids = Object.keys(claims.farewells);
  return ids.length > 0 ? ids[0] : null;
}
