export const AppRoles = [
  "Owner",
  "Admin",
  "Finance Manager",
  "Event Manager",
  "Moderator",
  "Member",
] as const;

export type AppRole = (typeof AppRoles)[number];
