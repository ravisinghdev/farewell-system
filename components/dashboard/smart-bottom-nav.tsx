"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { NAV_GROUPS } from "@/config/navigation";
import {
  PiggyBank,
  Home,
  Menu,
  PartyPopper,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";
import { motion } from "framer-motion";

export function SmartBottomNav() {
  const pathname = usePathname();
  const { farewell, isAdmin } = useFarewell();
  const farewellId = farewell?.id;
  const [isOpen, setIsOpen] = useState(false);

  // Helper to resolve dynamic paths
  const resolvePath = (path: string) => {
    if (path === "/dashboard") return `/dashboard/${farewellId}`;
    return path.replace("/dashboard", `/dashboard/${farewellId}`);
  };

  // 1. Define Main Tabs (Top Level)
  const mainTabs = [
    {
      label: "Home",
      icon: Home,
      href: "/dashboard",
      pattern: `/dashboard/${farewellId}`,
      exact: true,
    },
    {
      label: "Event",
      icon: PartyPopper,
      href: "/dashboard/farewell-event",
      pattern: `/dashboard/${farewellId}/farewell-event`,
      exact: false,
    },
    {
      label: "Finance",
      icon: PiggyBank,
      href: "/dashboard/contributions",
      pattern: `/dashboard/${farewellId}/contributions`,
      exact: false,
    },
    // {
    //   label: "Gallery",
    //   icon: ImageIcon,
    //   href: "/dashboard/memories",
    //   pattern: `/dashboard/${farewellId}/memories`,
    //   exact: false,
    // },
  ];

  // 2. Determine Active Tab
  const activeTab = mainTabs.find((tab) => {
    const resolvedPattern = resolvePath(tab.href);
    if (tab.exact) return pathname === resolvedPattern;
    return pathname.startsWith(resolvedPattern);
  });

  // 3. Get Context Links for Drawer
  // This logic is similar to UnifiedBottomNav but richer
  const getAllLinks = () => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        return true;
      }),
    })).filter((group) => group.items.length > 0);
  };

  const menuGroups = getAllLinks();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 pointer-events-none sm:hidden">
      <TooltipProvider delayDuration={0}>
        <nav className="pointer-events-auto flex items-center gap-2 p-2 bg-white/80 dark:bg-black/80 w-fit max-w-full rounded-2xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5">
          {/* Main Tabs */}
          {mainTabs.map((tab) => {
            const isActive = activeTab?.label === tab.label;
            const href = resolvePath(tab.href);

            return (
              <Tooltip key={tab.label}>
                <TooltipTrigger asChild>
                  <Link href={href} className="relative z-10 group">
                    <span
                      className={cn(
                        "relative z-10 flex items-center justify-center p-3 rounded-xl transition-all duration-300",
                        isActive
                          ? "text-white bg-primary shadow-lg shadow-primary/25"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                      )}
                    >
                      <tab.icon
                        className={cn(
                          "w-5 h-5",
                          isActive && "animate-in zoom-in-50 duration-300"
                        )}
                      />
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="mb-2 font-bold text-xs"
                  sideOffset={10}
                >
                  {tab.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Divider */}
          <div className="w-px h-8 bg-zinc-200 dark:bg-white/10 mx-1" />

          {/* Menu Drawer Trigger */}
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <button className="relative z-10 group outline-none">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "relative z-10 flex items-center justify-center p-3 rounded-xl transition-all duration-300 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10",
                        isOpen && "bg-zinc-100 dark:bg-white/10 text-foreground"
                      )}
                    >
                      <Menu className="w-5 h-5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="mb-2 font-bold text-xs"
                    sideOffset={10}
                  >
                    More
                  </TooltipContent>
                </Tooltip>
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] outline-none">
              <DrawerHeader className="text-left pb-0">
                <DrawerTitle className="text-lg font-bold flex items-center gap-2">
                  Menu
                </DrawerTitle>
              </DrawerHeader>

              <div className="p-4 overflow-y-auto max-h-[70vh] space-y-6">
                {/* Render All Groups */}
                {menuGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-1">
                      {group.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const href = resolvePath(item.href);
                        const isItemActive = pathname === href;
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.label}
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-sm font-medium",
                              isItemActive
                                ? "bg-primary/5 border-primary/20 text-primary"
                                : "bg-muted/30 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
                              item.disabled &&
                                "opacity-50 cursor-not-allowed pointer-events-none"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4",
                                isItemActive
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                            {item.disabled && (
                              <span className="text-[10px] ml-auto bg-muted-foreground/10 px-1.5 py-0.5 rounded text-muted-foreground">
                                Soon
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Bottom Support/Admin section */}
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-center text-xs text-muted-foreground">
                    Farewell Dashboard v1.0
                  </p>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </nav>
      </TooltipProvider>
    </div>
  );
}




