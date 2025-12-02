import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";
import { UserRole } from "./roles";

type FarewellRole = Database["public"]["Enums"]["farewell_role"];

/**
 * Gets the user's role for a specific farewell from the database
 * This is more reliable than JWT claims as it always reflects current database state
 *
 * @param farewellId - The farewell ID to check
 * @param userId - The user ID to check
 * @returns The user's role or null if not a member
 */
export async function getFarewellRoleFromDB(
  farewellId: string,
  userId: string
): Promise<FarewellRole | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) {
    console.log("Error fetching role from DB:", error?.message);
    return null;
  }

  return data.role;
}

/**
 * Checks if user has admin privileges (admin, parallel_admin, or main_admin)
 *
 * @param farewellId - The farewell ID to check
 * @param userId - The user ID to check
 * @returns True if user is an admin
 */
export async function isFarewellAdmin(
  farewellId: string,
  userId: string
): Promise<boolean> {
  const role = await getFarewellRoleFromDB(farewellId, userId);
  return (
    role === "admin" ||
    (role as string) === "parallel_admin" ||
    (role as string) === "main_admin"
  );
}

/**
 * Checks if user is a member of the farewell
 *
 * @param farewellId - The farewell ID to check
 * @param userId - The user ID to check
 * @returns True if user is a member
 */
export async function isFarewellMember(
  farewellId: string,
  userId: string
): Promise<boolean> {
  const role = await getFarewellRoleFromDB(farewellId, userId);
  return role !== null;
}
