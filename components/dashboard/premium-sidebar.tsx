"use client";

import * as React from "react";
import { NAV_GROUPS } from "@/config/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { Sparkles, Command, ChevronRight } from "lucide-react";

export function PremiumSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, farewell } = useFarewell();
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  // Force expanded view on mobile for better UX
  const isCollapsed = isMobile ? false : state === "collapsed";

  const farewellId = farewell.id;
  const role = farewell.role;

  const p = (path: string) => {
    if (path === "/dashboard") return `/dashboard/${farewellId}`;
    return path.replace("/dashboard", `/dashboard/${farewellId}`);
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-none bg-transparent shadow-none"
    >
      <div
        className={cn(
          "h-full py-3 transition-[padding] duration-300",
          isCollapsed ? "px-1" : "px-3"
        )}
      >
        <div className="flex h-full flex-col rounded-3xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header Area */}
          <SidebarHeader
            className={cn(
              "relative z-10 transition-[padding] duration-300",
              isCollapsed ? "pt-4 pb-2" : "pt-6 pb-2"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3 px-3 transition-opacity duration-300",
                isCollapsed ? "justify-center px-0" : ""
              )}
            >
              <div
                className={cn(
                  "shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20 relative group transition-all duration-300",
                  isCollapsed ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                <div className="h-full w-full rounded-[15px] bg-black/40 backdrop-blur-xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Sparkles
                    className={cn(
                      "text-white relative z-10 transition-all duration-300",
                      isCollapsed ? "h-4 w-4" : "h-5 w-5"
                    )}
                  />
                </div>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-left-2">
                  <span className="font-bold text-sm tracking-tight text-foreground truncate">
                    {farewell.name || "Farewell"}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate">
                    {farewell.year} • Active
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Scrollable Content */}
          <SidebarContent
            className={cn(
              "gap-0 space-y-8 scrollbar-none py-4 transition-[padding] duration-300",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => {
                if (item.adminOnly && !checkIsAdmin(role)) return false;
                return true;
              });

              if (visibleItems.length === 0) return null;

              return (
                <SidebarGroup key={group.title} className="p-0 space-y-2">
                  {!isCollapsed && (
                    <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {group.title}
                    </div>
                  )}
                  <SidebarMenu className="gap-1.5">
                    {visibleItems.map((item) => {
                      const fullPath = p(item.href);
                      // Strict match for Home, StartsWith for sections (to support nested details pages)
                      const isActive =
                        item.href === "/dashboard"
                          ? pathname === fullPath
                          : pathname.startsWith(fullPath);

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.label}
                            className={cn(
                              "h-10 w-full transition-all duration-300 rounded-xl group/btn overflow-hidden relative",
                              isActive
                                ? "bg-primary/10 text-primary shadow-sm font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                              item.disabled && "opacity-40 cursor-not-allowed"
                            )}
                            disabled={item.disabled}
                          >
                            {item.disabled ? (
                              <div className="flex items-center gap-3 px-3 w-full h-full text-muted-foreground/50">
                                <item.icon className="h-[18px] w-[18px]" />
                                {!isCollapsed && (
                                  <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                    <span className="text-sm truncate">
                                      {item.label}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-auto">
                                      SOON
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Link
                                href={fullPath}
                                className={cn(
                                  "flex items-center w-full h-full relative z-10",
                                  isCollapsed
                                    ? "justify-center px-0"
                                    : "gap-3 px-3"
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    "transition-colors duration-300",
                                    isCollapsed
                                      ? "h-5 w-5"
                                      : "h-[18px] w-[18px]",
                                    isActive
                                      ? "text-primary"
                                      : "group-hover/btn:text-foreground"
                                  )}
                                />

                                {!isCollapsed && (
                                  <span className="text-sm truncate flex-1">
                                    {item.label}
                                  </span>
                                )}

                                {/* Active Pulse Dot - Only when Expanded */}
                                {isActive && !isCollapsed && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
                                )}

                                {/* Active Background Glow for Collapsed */}
                                {isActive && isCollapsed && (
                                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                )}
                              </Link>
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

          {/* Footer / Pro Tip */}
          <SidebarFooter className="p-4 relative">
            {!isCollapsed && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  <Command className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-foreground/80 mb-1">
                  Quick Actions
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Press{" "}
                  <kbd className="bg-background px-1 rounded text-foreground border border-border">
                    ⌘K
                  </kbd>{" "}
                  to search
                </p>
              </div>
            )}
          </SidebarFooter>
        </div>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
