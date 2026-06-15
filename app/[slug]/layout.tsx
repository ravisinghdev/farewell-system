import { ReactNode } from "react";
import { getOrganizationContext } from "@/features/organizations/context/organization-cache";
import { OrganizationProvider } from "@/features/organizations/context/organization-provider";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";
import { createClient } from "@/lib/supabase/server";

export default async function SlugLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getOrganizationContext();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all memberships for the switcher
  const { data: dbMemberships } = await supabase
    .from("organization_members")
    .select("id, role, organizations(id, name, slug)")
    .eq("user_id", user?.id || "");

  const memberships = (dbMemberships || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    organization: Array.isArray(m.organizations) ? m.organizations[0] : m.organizations,
  }));

  return (
    <OrganizationProvider value={context}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b h-14 flex items-center px-4 gap-4">
          <OrganizationSwitcher memberships={memberships} />
          {/* Navigation can go here */}
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </OrganizationProvider>
  );
}
