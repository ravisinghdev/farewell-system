/**
 * Dashboard layout wrapper for farewell-specific pages.
 *
 * This layout provides the sidebar navigation and breadcrumb system
 * for all dashboard pages. It automatically determines the active farewell
 * and user's role for that farewell.
 */

import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getClaims, AuthClaims } from "@/lib/auth/claims";
import { getFarewellRoleFromDB } from "@/lib/auth/roles-server";
import { UserRole } from "@/lib/auth/roles";
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar";
import { PremiumNavbar } from "@/components/dashboard/premium-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProfileProvider } from "@/components/profile-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { redirect } from "next/navigation";
import { AppearanceProvider } from "@/components/settings/appearance-provider";
import { FarewellProvider } from "@/components/providers/farewell-provider";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { UnifiedBottomNav } from "@/components/dashboard/unified-bottom-nav";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";

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
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData || !claimsData.claims) {
    return redirect("/auth");
  }

  const userClaims = claimsData.claims;
  const userId = userClaims.sub;

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  // Fallback for user data if not logged in (middleware should catch this, but for safety)
  const initialUser = {
    ...userData,
    email: userClaims.email,
    name: userData?.full_name || userClaims.user_metadata?.full_name || "User",
    avatar: userData?.avatar_url || userClaims.user_metadata?.avatar_url || "",
    id: userId,
  };

  // We can use the claims directly, no need to call getClaims(user) again
  // But getClaims helper expects a User object.
  // We can just use userClaims directly as it matches the structure mostly,
  // or we can reconstruct what we need.
  // Actually, userClaims IS the AuthClaims structure (plus standard claims).
  // Let's cast it.
  const claims = userClaims as unknown as AuthClaims;

  let farewellId = id;

  if (!farewellId) {
    if (
      claims.app_metadata.farewells &&
      Object.keys(claims.app_metadata.farewells).length > 0
    ) {
      farewellId = Object.keys(claims.app_metadata.farewells)[0];
    } else {
      // Fallback: Query DB
      const { data: member } = await supabase
        .from("farewell_members")
        .select("farewell_id")
        .eq("user_id", userId)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (member) farewellId = member.farewell_id;
    }
  }

  const role =
    userId && farewellId
      ? (await getFarewellRoleFromDB(farewellId, userId)) || "student"
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
    .eq("user_id", userId)
    .single();

  return (
    <FarewellProvider
      user={initialUser}
      farewell={{
        id: farewellId || "",
        name: farewellName,
        year: farewellYear,
        role: role as UserRole,
      }}
      claims={claims.app_metadata}
      authClaims={claims}
    >
      <SidebarProvider>
        <ProfileProvider initialUser={initialUser}>
          <SettingsProvider initialSettings={settings} userId={userId}>
            <AppearanceProvider>
              <PremiumSidebar />
              <SidebarInset className="flex flex-col overflow-hidden bg-background">
                <PremiumNavbar />

                {/* MAIN SCROLL CONTAINER */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4">
                  <div className="flex flex-col gap-4 p-4 pt-0 max-w-full">
                    <div className="px-1 py-2">
                      <DashboardBreadcrumb />
                    </div>

                    {children}
                  </div>
                </div>

                <UnifiedBottomNav />
              </SidebarInset>

              <AdminNotifications userId={userId} role={role} />
            </AppearanceProvider>
          </SettingsProvider>
        </ProfileProvider>
      </SidebarProvider>
    </FarewellProvider>
  );
}
