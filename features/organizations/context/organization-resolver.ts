import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function resolveActiveOrganizationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("active_organization_id")?.value;
  
  if (cookieOrgId) {
    return cookieOrgId;
  }

  // Fallback to database users table
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pref } = await supabase
    .from("users")
    .select("last_active_organization_id")
    .eq("id", user.id)
    .single();

  // @ts-ignore
  if (pref?.last_active_organization_id) {
    // @ts-ignore
    return pref.last_active_organization_id;
  }

  // If no preference is set, check if they belong to exactly one organization
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(2);

  if (memberships && memberships.length === 1) {
    return memberships[0].organization_id;
  }

  return null;
}
