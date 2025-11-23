// lib/auth/roles.ts

export const USER_ROLES = ["student", "teacher", "parallel_admin", "main_admin"] as const;

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

// Role → permission map
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]) {
  const rolePerms = new Set(ROLE_PERMISSIONS[role] ?? []);
  return permissions.some((p) => rolePerms.has(p));
}
