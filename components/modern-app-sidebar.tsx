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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { Sparkles, Command } from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: any;
  farewellId?: string;
  farewellName?: string;
  farewellYear?: string | number;
  role?: string;
}

export default function ModernAppSidebar({
  user: propUser,
  farewellId: propFarewellId,
  farewellName: propFarewellName,
  farewellYear: propFarewellYear,
  role: propRole,
  ...props
}: AppSidebarProps) {
  const { user, farewell } = useFarewell();
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed" && !isMobile;

  const farewellId = farewell.id;
  const farewellName = farewell.name;
  const farewellYear = farewell.year;
  const role = farewell.role;

  const p = (path: string) => {
    if (path === "/dashboard") return `/dashboard/${farewellId}`;
    return path.replace("/dashboard", `/dashboard/${farewellId}`);
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "group/sidebar-wrapper h-full bg-black/40 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col z-50 shadow-2xl",
        state === "collapsed"
          ? "w-[var(--sidebar-width-icon)]"
          : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Abstract shapes for premium feel */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <SidebarHeader className="pb-4 pt-4 relative z-10">
        {/* Expanded Header */}
        <div
          className={cn(
            "px-2 flex items-center gap-3 transition-opacity duration-300",
            isCollapsed ? "hidden opacity-0" : "opacity-100"
          )}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)] border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Sparkles className="h-5 w-5 text-white relative z-10" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              {farewellName || "Farewell"}
            </span>
            <span className="text-[10px] text-primary/80 uppercase tracking-widest font-semibold mt-0.5">
              {farewellYear} Edition
            </span>
          </div>
        </div>
        {/* Collapsed Icon Header */}
        <div
          className={cn(
            "hidden items-center justify-center pt-1 transition-all",
            isCollapsed ? "flex" : "hidden"
          )}
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-0 space-y-6 relative z-10 scrollbar-none">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.adminOnly && !checkIsAdmin(role)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title} className="p-0">
              {/* Label only visible when expanded */}
              {!isCollapsed && (
                <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">
                  {group.title}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const fullPath = p(item.href);
                  const isActive =
                    fullPath === `/dashboard/${farewellId}`
                      ? pathname === fullPath
                      : pathname.startsWith(fullPath);

                  return (
                    <SidebarMenuItem key={item.label} className="mb-1">
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className={cn(
                          "relative h-9 rounded-xl transition-all duration-300 overflow-hidden group/item",
                          isActive
                            ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1",
                          item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={item.disabled}
                      >
                        {/* Active Left Border Indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                        )}
                        {item.disabled ? (
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className="h-4 w-4 min-w-4" />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={fullPath}
                            className="flex items-center gap-3 w-full"
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 min-w-4 transition-transform group-hover:scale-110",
                                isActive && "text-primary"
                              )}
                            />

                            {!isCollapsed && (
                              <span className="truncate animate-in fade-in duration-200">
                                {item.label}
                              </span>
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

      <SidebarFooter className="p-4 border-t border-border/20">
        {!isCollapsed && (
          <div className="rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-3 hidden md:block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-400">
                Pro Tip
              </span>
              <Command className="h-3 w-3 text-gray-600" />
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Press <kbd className="font-sans text-gray-300">⌘K</kbd> to search
              anywhere.
            </p>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
