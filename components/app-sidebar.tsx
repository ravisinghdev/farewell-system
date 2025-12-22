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
import { usePathname } from "next/navigation"; // Added for active state

import { SidebarChatList } from "@/components/chat/sidebar-chat-list";

import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils"; // Ensure you have this utility or use standard class string

// Define types for the props
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // Props are now optional/unused as we use context
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
  // Helper to prefix links
  const p = (path: string) => {
    // If path is exactly /dashboard, append ID.
    // If path is /dashboard/something, insert ID: /dashboard/[id]/something
    if (path === "/dashboard") return `/dashboard/${farewellId}`;
    return path.replace("/dashboard", `/dashboard/${farewellId}`);
  };

  // Nav groups extracted to config/navigation.ts

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl z-50 shadow-2xl"
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

                  const linkContent = (
                    <div
                      className={cn(
                        "flex items-center gap-3 py-2 w-full",
                        item.disabled ? "cursor-not-allowed opacity-50" : ""
                      )}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && !item.disabled && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                      )}

                      <item.icon
                        className={cn(
                          "h-4 w-4 transition-transform group-hover/item:scale-110",
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

                      {/* Hover Glow Effect */}
                      {!item.disabled && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sidebar-accent/10 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-700 pointer-events-none" />
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
                          "relative transition-all duration-200 ease-in-out group/item overflow-hidden",
                          isActive && !item.disabled
                            ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary/20 hover:text-primary"
                            : item.disabled
                            ? "text-muted-foreground bg-transparent"
                            : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:translate-x-1"
                        )}
                        disabled={item.disabled}
                      >
                        {item.disabled ? (
                          linkContent // Just a div, not a Link
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
