"use client";

import { createContext, useContext } from "react";

export type OrganizationRole = "Owner" | "Admin" | "Finance Manager" | "Event Manager" | "Moderator" | "Member";

export interface OrganizationContextValue {
  organizationId: string | null;
  membershipId: string | null;
  role: OrganizationRole | null;
  organizationSlug: string | null;
  organizationName: string | null;
}

export const OrganizationContext = createContext<OrganizationContextValue>({
  organizationId: null,
  membershipId: null,
  role: null,
  organizationSlug: null,
  organizationName: null,
});

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
