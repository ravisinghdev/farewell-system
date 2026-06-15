import { AppPermission, AppPermissions } from "./permissions";
import { AppRole } from "./roles";

// The matrix maps each role to the exact permissions they possess
export const RoleMatrix: Record<AppRole, ReadonlyArray<AppPermission>> = {
  Owner: AppPermissions, // Owner gets absolutely everything
  Admin: [
    "organization.view",
    "organization.update",
    "members.invite",
    "members.remove",
    "members.role.change",
    "events.create",
    "events.update",
    "events.delete",
    "events.members.manage",
    "tasks.create",
    "tasks.assign",
    "tasks.complete",
    "billing.view",
    "messages.moderate",
    "content.moderate",
    "logs.view",
  ],
  "Finance Manager": [
    "organization.view",
    "billing.view",
    "billing.manage",
  ],
  "Event Manager": [
    "organization.view",
    "events.create",
    "events.update",
    "events.delete",
    "events.members.manage",
    "tasks.create",
    "tasks.assign",
    "tasks.complete",
  ],
  Moderator: [
    "organization.view",
    "messages.moderate",
    "content.moderate",
  ],
  Member: [
    "organization.view",
    "tasks.complete",
  ],
};
