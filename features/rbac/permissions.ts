export const AppPermissions = [
  // Organization
  "organization.view",
  "organization.update",
  "organization.delete",

  // Members
  "members.invite",
  "members.remove",
  "members.role.change",
  "members.transfer_ownership",

  // Events
  "events.create",
  "events.update",
  "events.delete",
  "events.members.manage",

  // Tasks
  "tasks.create",
  "tasks.assign",
  "tasks.complete",

  // Finance
  "billing.view",
  "billing.manage",

  // Moderation
  "messages.moderate",
  "content.moderate",

  // System
  "logs.view",
  "api_keys.manage",
] as const;

export type AppPermission = (typeof AppPermissions)[number];
