import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveOrganizationId } from "./organization-resolver";
import { OrganizationContextValue, OrganizationRole } from "./organization-context";

export const getOrganizationContext = cache(async (): Promise<OrganizationContextValue> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyContext: OrganizationContextValue = {
    organizationId: null,
    membershipId: null,
    role: null,
    organizationSlug: null,
    organizationName: null,
  };

  if (!user) return emptyContext;

  const organizationId = await resolveActiveOrganizationId();
  if (!organizationId) return emptyContext;

  const { data: membership } = await supabase
    .from("organization_members")
    .select(`
      id,
      role,
      organizations (
        name,
        slug
      )
    `)
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !membership.organizations) {
    return emptyContext;
  }

  // Type coercions safely mapping database shapes
  const org = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;

  return {
    organizationId: organizationId,
    membershipId: membership.id,
    role: membership.role as OrganizationRole,
    organizationSlug: org.slug,
    organizationName: org.name,
  };
});
