/**
 * @fileoverview Role type definitions and database operations for user roles.
 *
 * This module provides centralized role type definitions that match the application's
 * role hierarchy and functions for fetching user roles from the database.
 *
 * @module lib/auth/roles-db
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import fs from "fs";
import path from "path";

function logToFile(message: string) {
  try {
    const logPath = path.join(process.cwd(), "debug-roles.log");
    fs.appendFileSync(
      logPath,
      new Date().toISOString() + ": " + message + "\n"
    );
  } catch (e) {
    // ignore logging errors
  }
}

/**
 * Available user roles in the Farewell Management System.
 *
 * Role hierarchy (ascending authority):
 * - `student`: Basic user with read access and limited contributions
 * - `teacher`: Elevated permissions for content management
 * - `parallel_admin`: Co-administrator with most admin capabilities
 * - `main_admin`: Full system administrator with all permissions
 *
 * @typedef {("student" | "teacher" | "parallel_admin" | "main_admin")} UserRoleName
 */
export type UserRoleName =
  | "student"
  | "teacher"
  | "parallel_admin"
  | "main_admin"
  | "admin"
  | "guest"
  | "junior";

/**
 * Fetches a user's role from the database based on their user ID and farewell ID.
 *
 * This function queries the database to retrieve the role assigned to a specific user
 * for a specific farewell event.
 *
 * @async
 * @param {string} userId - The unique identifier of the user
 * @param {string} farewellId - The unique identifier of the farewell
 * @returns {Promise<UserRoleName>} The user's role
 */
export async function getUserRoleFromDb(
  userId: string,
  farewellId: string
): Promise<UserRoleName> {
  logToFile(
    `getUserRoleFromDb called for user ${userId}, farewell ${farewellId}`
  );
  try {
    const { data, error } = await supabaseAdmin
      .from("farewell_members")
      .select("role")
      .eq("user_id", userId)
      .eq("farewell_id", farewellId)
      .single();

    if (error || !data) {
      logToFile(`getUserRoleFromDb error or no data: ${JSON.stringify(error)}`);
      return "student";
    }

    logToFile(`getUserRoleFromDb found role: ${data.role}`);
    return (data.role as UserRoleName) || "student";
  } catch (e) {
    logToFile(`getUserRoleFromDb exception: ${e}`);
    return "student";
  }
}
