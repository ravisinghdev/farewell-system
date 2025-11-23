import { Session, User } from "@supabase/supabase-js";

export type FarewellRole = "student" | "teacher" | "parallel_admin" | "main_admin";

export interface FarewellClaims {
  [farewellId: string]: FarewellRole;
}

export interface UserClaims {
  farewells?: FarewellClaims;
  [key: string]: any;
}

/**
 * Extracts custom claims from the user object.
 * This is the "getClaims" functionality requested.
 */
export function getClaims(user: User | null): UserClaims {
  if (!user || !user.app_metadata) return {};
  return user.app_metadata as UserClaims;
}

/**
 * Gets the role for a specific farewell from the session.
 * Returns null if the user is not part of the farewell.
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
 * Checks if the user has any active farewell membership.
 */
export function hasAnyFarewell(user: User | null): boolean {
  const claims = getClaims(user);
  return !!claims.farewells && Object.keys(claims.farewells).length > 0;
}

/**
 * Gets the first available farewell ID (useful for default redirects).
 */
export function getFirstFarewellId(user: User | null): string | null {
  const claims = getClaims(user);
  if (!claims.farewells) return null;
  const ids = Object.keys(claims.farewells);
  return ids.length > 0 ? ids[0] : null;
}
