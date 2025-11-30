// lib/auth/roles.ts

// All possible user roles in the system
export const USER_ROLES = [
  "admin",
  "student",
  "guest",
  "teacher",
  "junior",
  "parallel_admin",
  "main_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

// PERMISSIONS
export const PERMISSIONS = [
  "auth.self.read",
  "auth.self.update",
  "auth.users.read",
  "auth.users.update",
  "auth.roles.update",
  "farewell.read",
  "farewell.create",
  "farewell.manage",
  "contribution.pay",
  "contribution.manage",
  "duty.assign",
  "duty.view",
  "gallery.upload",
  "gallery.manage",
  "chat.participate",
  "chat.moderate",
  "announcement.create",
  "notification.create",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Role → permission map (only defining for main roles, guest/junior inherit from student)
export const ROLE_PERMISSIONS: Partial<Record<UserRole, Permission[]>> = {
  admin: [
    "auth.self.read",
    "auth.self.update",
    "farewell.read",
    "farewell.manage",
    "contribution.pay",
    "contribution.manage",
    "duty.assign",
    "duty.view",
    "gallery.upload",
    "gallery.manage",
    "chat.participate",
    "chat.moderate",
    "announcement.create",
    "notification.create",
  ],
  student: [
    "auth.self.read",
    "auth.self.update",
    "farewell.read",
    "contribution.pay",
    "duty.view",
    "gallery.upload",
    "chat.participate",
  ],
  teacher: [
    "auth.self.read",
    "auth.self.update",
    "farewell.read",
    "contribution.pay",
    "gallery.upload",
    "gallery.manage",
    "chat.participate",
    "chat.moderate",
    "announcement.create",
    "notification.create",
  ],
  parallel_admin: [
    "auth.self.read",
    "auth.self.update",
    "farewell.read",
    "farewell.manage",
    "contribution.pay",
    "contribution.manage",
    "duty.assign",
    "duty.view",
    "gallery.upload",
    "gallery.manage",
    "chat.participate",
    "chat.moderate",
    "announcement.create",
    "notification.create",
  ],
  main_admin: [
    "auth.self.read",
    "auth.self.update",
    "auth.users.read",
    "auth.users.update",
    "auth.roles.update",
    "farewell.read",
    "farewell.create",
    "farewell.manage",
    "contribution.pay",
    "contribution.manage",
    "duty.assign",
    "duty.view",
    "gallery.upload",
    "gallery.manage",
    "chat.participate",
    "chat.moderate",
    "announcement.create",
    "notification.create",
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.student ?? [];
}

export function hasPermission(role: UserRole, permission: Permission) {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]) {
  const rolePerms = new Set(getPermissionsForRole(role));
  return permissions.some((p) => rolePerms.has(p));
}

// ==========================================
// DATABASE ROLE FETCHING (Server-side only)
// ==========================================

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";

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
