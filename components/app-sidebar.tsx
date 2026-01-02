"use client";

import * as React from "react";
import { NAV_GROUPS } from "@/config/navigation";

import { FarewellHeader } from "@/components/farewell-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { StatBadge } from "@/components/sidebar/stat-badge";
import { ProgressIndicator } from "@/components/sidebar/progress-indicator";
import {
  getContributionQuickStatsAction,
  getContributionProgressAction,
  getPendingActionsCountAction,
} from "@/app/actions/contribution-stats-actions";

// Define types for the props
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: any;
  farewellId?: string;
  farewellName?: string;
  farewellYear?: string | number;
  role?: string;
}

export function AppSidebar({
  user: propUser,
  farewellId: propFarewellId,
  farewellName: propFarewellName,
  farewellYear: propFarewellYear,
  role: propRole,
  ...props
}: AppSidebarProps) {
  const { user, farewell } = useFarewell();
  const pathname = usePathname();

  const farewellId = farewell.id;
  const farewellName = farewell.name;
  const farewellYear = farewell.year;
  const role = farewell.role;

  // Stats state
  const [stats, setStats] = React.useState<{
    total: number;
    pending: number;
    verified: number;
  } | null>(null);
  const [progress, setProgress] = React.useState<{
    assigned: number;
    paid: number;
    remaining: number;
    percentage: number;
  } | null>(null);
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);

  // Fetch stats on mount
  React.useEffect(() => {
    if (farewellId) {
      // Load stats for regular users
      getContributionQuickStatsAction(farewellId).then(setStats);
      getContributionProgressAction(farewellId).then(setProgress);

      if (checkIsAdmin(role)) {
        getPendingActionsCountAction(farewellId).then((data) =>
          setPendingCount(data?.pendingCount ?? null)
        );
      }
    }
  }, [farewellId, role]);

  // Helper to prefix links
  const p = (path: string) => {
    if (path === "/dashboard") return `/dashboard/${farewellId}`;
    return path.replace("/dashboard", `/dashboard/${farewellId}`);
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl z-50 shadow-sm"
    >
      <SidebarHeader className="pb-4 pt-4">
        <FarewellHeader name={farewellName} year={farewellYear} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        {NAV_GROUPS.map((group) => {
          // Filter out items based on role (adminOnly)
          const visibleItems = group.items.filter((item) => {
            if (item.adminOnly && !checkIsAdmin(role)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title} className="py-2">
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/70 mb-1">
                {group.title}
              </SidebarGroupLabel>
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const fullPath = p(item.href);
                  const isActive = pathname === fullPath;

                  // Determine stat badge to show
                  let badge: React.ReactNode = null;

                  if (item.showStats && stats) {
                    // Show stats for history, receipt, and manage pages
                    if (item.href.includes("/history")) {
                      badge = (
                        <StatBadge value={stats.total} variant="secondary" />
                      );
                    } else if (item.href.includes("/receipt")) {
                      badge = (
                        <StatBadge value={stats.verified} variant="success" />
                      );
                    } else if (
                      item.href.includes("/manage") &&
                      pendingCount !== null &&
                      pendingCount > 0
                    ) {
                      badge = (
                        <StatBadge value={pendingCount} variant="warning" />
                      );
                    }
                  }

                  const linkContent = (
                    <div
                      className={cn(
                        "flex flex-col gap-1.5 py-2 w-full",
                        item.disabled ? "cursor-not-allowed opacity-50" : ""
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {/* Active Indicator Bar - Simple line */}
                        {isActive && !item.disabled && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-sm" />
                        )}

                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive && "text-primary"
                          )}
                        />
                        <span className="font-medium text-sm tracking-tight text-left flex-1 truncate">
                          {item.label}
                        </span>

                        {item.disabled && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border uppercase tracking-wider leading-none">
                            Soon
                          </span>
                        )}

                        {/* Show badge if available */}
                        {badge}
                      </div>

                      {/* Progress indicator for overview */}
                      {item.showProgress &&
                        progress &&
                        progress.assigned > 0 && (
                          <ProgressIndicator
                            current={progress.paid}
                            total={progress.assigned}
                            className="px-8"
                            showPercentage
                          />
                        )}
                    </div>
                  );

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        tooltip={
                          item.disabled
                            ? item.disabledTooltip || "Coming Soon"
                            : item.label
                        }
                        className={cn(
                          "relative transition-colors duration-200",
                          isActive && !item.disabled
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : item.disabled
                            ? "text-muted-foreground bg-transparent"
                            : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                        )}
                        disabled={item.disabled}
                      >
                        {item.disabled ? (
                          linkContent
                        ) : (
                          <Link href={fullPath}>{linkContent}</Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>{/* NavUser moved to Top Navbar */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
