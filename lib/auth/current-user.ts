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
import { getClaims } from "./claims";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";

function logToFile(message: string) {
  try {
    const logPath = path.join(process.cwd(), "debug-roles.log");
    fs.appendFileSync(
      logPath,
      new Date().toISOString() + ": [CurrentUser] " + message + "\n"
    );
  } catch (e) {
    // ignore
  }
}

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
  name: string;
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

export async function getCurrentUserWithRole(
  farewellId?: string
): Promise<AuthUserWithRole | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data || !data.claims) return null;

  const claims = data.claims;
  const userId = claims.sub;

  // Extract user metadata from claims if available, or fall back to empty
  const userMetadata =
    (claims.user_metadata as { full_name?: string; avatar_url?: string }) || {};
  const email = (claims.email as string) || "";

  let role: UserRoleName = "student";

  // Try to get role from Custom Claims (app_metadata)
  // Note: claims.app_metadata is where custom claims usually live in the JWT
  const appMetadata =
    (claims.app_metadata as { farewells?: Record<string, UserRoleName> }) || {};

  if (farewellId && appMetadata.farewells) {
    if (appMetadata.farewells[farewellId]) {
      role = appMetadata.farewells[farewellId];
      logToFile(`Found role in claims: ${role}`);
    }
  }

  // Fallback: Fetch from DB if claims are missing or to ensure latest data
  if (farewellId && role === "student") {
    logToFile(`Role is student or missing, checking DB...`);
    const dbRole = await getUserRoleFromDb(userId, farewellId);
    if (dbRole) {
      role = dbRole;
      logToFile(`Found role in DB: ${role}`);
    }
  }

  return {
    id: userId,
    name: userMetadata.full_name || "",
    email: email,
    role,
    raw: {
      id: userId,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
      email: email,
    },
  };
}

export async function getCurrentUser() {
  const client = await createClient();
  const { data } = await client.auth.getClaims();
  if (!data || !data.claims) {
    redirect("/auth");
  }

  return data;
}
