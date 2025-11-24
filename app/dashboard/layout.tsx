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
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
  // If id is present, use it. If not, try to get the first one.
  const farewellId =
    id || (claims.farewells ? Object.keys(claims.farewells)[0] : "");

  const role = user
    ? getFarewellRole(user, farewellId) || "student"
    : "student";

  return (
    <SidebarProvider>
      <AppSidebar user={userData} farewellId={farewellId} role={role} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DashboardBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
