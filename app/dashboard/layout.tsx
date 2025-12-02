/**
 * Dashboard layout wrapper for farewell-specific pages.
 *
 * This layout provides the sidebar navigation and breadcrumb system
 * for all dashboard pages. It automatically determines the active farewell
 * and user's role for that farewell.
 */

import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getClaims } from "@/lib/auth/claims";
import { getFarewellRoleFromDB } from "@/lib/auth/roles-server";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProfileProvider } from "@/components/profile-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { redirect } from "next/navigation";
import { AppearanceProvider } from "@/components/settings/appearance-provider";
import { FarewellProvider } from "@/components/providers/farewell-provider";
import { AdminNotifications } from "@/components/admin/admin-notifications";

// Metadata for dashboard pages
export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your farewell events, contributions, galleries, and communications.",
};

/**
 * Dashboard Layout Component
 *
 * Features:
 * - Automatic farewell ID detection from URL
 * - Role-based sidebar navigation
 * - Collapsible sidebar with breadcrumb navigation
 * - User session management
 *
 * @param children - Dashboard page content
 * @param params - Route parameters (contains farewell ID if present)
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fallback for user data if not logged in (middleware should catch this, but for safety)
  const initialUser = {
    ...userData,
    email: user.email,
    name: userData?.full_name || user.user_metadata?.full_name || "User",
    avatar: userData?.avatar_url || user.user_metadata?.avatar_url || "",
    id: user.id,
  };

  const claims = getClaims(user);

  let farewellId = id;

  if (!farewellId) {
    if (claims.farewells && Object.keys(claims.farewells).length > 0) {
      farewellId = Object.keys(claims.farewells)[0];
    } else if (user) {
      // Fallback: Query DB
      const { data: member } = await supabase
        .from("farewell_members")
        .select("farewell_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (member) farewellId = member.farewell_id;
    }
  }

  const role =
    user && farewellId
      ? (await getFarewellRoleFromDB(farewellId, user.id)) || "student"
      : "student";

  // Fetch farewell details for the sidebar
  let farewellName = "Farewell System";
  let farewellYear: string | number = new Date().getFullYear();

  if (farewellId) {
    const { data: farewell } = await supabase
      .from("farewells")
      .select("name, year")
      .eq("id", farewellId)
      .single();

    if (farewell) {
      farewellName = farewell.name;
      farewellYear = farewell.year;
    }
  }

  // Fetch initial settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <FarewellProvider
      user={initialUser}
      farewell={{
        id: farewellId || "",
        name: farewellName,
        year: farewellYear,
        role: role as any,
      }}
    >
      <SidebarProvider>
        <ProfileProvider initialUser={initialUser}>
          <SettingsProvider initialSettings={settings} userId={user.id}>
            <AppearanceProvider>
              <AppSidebar />
              <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
                  {children}
                </div>
              </SidebarInset>
              <AdminNotifications userId={user.id} role={role} />
            </AppearanceProvider>
          </SettingsProvider>
        </ProfileProvider>
      </SidebarProvider>
    </FarewellProvider>
  );
}
