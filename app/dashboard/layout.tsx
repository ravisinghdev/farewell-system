/**
 * Dashboard layout wrapper for farewell-specific pages.
 *
 * This layout provides the sidebar navigation and breadcrumb system
 * for all dashboard pages. It automatically determines the active farewell
 * and user's role for that farewell.
 */

import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getClaims, getFarewellRole } from "@/lib/auth/claims";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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

  // Fallback for user data if not logged in (middleware should catch this, but for safety)
  const userData = {
    name: user?.user_metadata?.full_name || "User",
    email: user?.email || "",
    avatar: user?.user_metadata?.avatar_url || "",
    id: user?.id || "",
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

  const role = user
    ? getFarewellRole(user, farewellId || "") || "student"
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

  return (
    <SidebarProvider>
      <AppSidebar
        user={userData}
        farewellId={farewellId || ""}
        farewellName={farewellName}
        farewellYear={farewellYear}
        role={role}
      />
      <SidebarInset className="bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <SiteHeader user={userData} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-transparent">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
