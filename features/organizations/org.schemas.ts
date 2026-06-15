import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(50),
});

export const joinOrganizationSchema = z.object({
  inviteCode: z.string().min(4, "Invite code must be valid").max(50),
});

export const createInvitationSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  role: z.enum(["Owner", "Admin", "Member"]).default("Member"),
});
