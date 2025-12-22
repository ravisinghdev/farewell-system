"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { NAV_GROUPS } from "@/config/navigation";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UnifiedBottomNav() {
  const pathname = usePathname();
  const { farewell, isAdmin } = useFarewell();
  const farewellId = farewell.id;

  // 1. Identify active group based on current path
  const activeGroup =
    NAV_GROUPS.find((group) => {
      // Check if any item in this group matches the current path start
      return group.items.some((item) => {
        // Normalize item href to handle dynamic [id]
        // e.g. /dashboard/events -> /dashboard/[id]/events
        // The config uses /dashboard/events format

        // Construct what the REAL path looks like
        const realHref =
          item.href === "/dashboard"
            ? `/dashboard/${farewellId}`
            : item.href.replace("/dashboard", `/dashboard/${farewellId}`);

        if (item.href === "/dashboard") return pathname === realHref;
        return pathname.startsWith(realHref);
      });
    }) || NAV_GROUPS[0]; // Default to Overview if nothing matches perfectly

  // 2. Filter items for current view
  const navItems = activeGroup.items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 pointer-events-none sm:hidden">
      <TooltipProvider delayDuration={0}>
        <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-black/40 w-fit max-w-full overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 no-scrollbar">
          {navItems.map((link) => {
            const dynamicHref =
              link.href === "/dashboard"
                ? `/dashboard/${farewellId}`
                : link.href.replace("/dashboard", `/dashboard/${farewellId}`);

            // Active logic: Exact match for home, startsWith for others
            const isActive =
              link.href === "/dashboard"
                ? pathname === dynamicHref
                : pathname.startsWith(dynamicHref);

            const Icon = link.icon;

            const content = (
              <span
                className={cn(
                  "relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap",
                  link.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer",
                  isActive
                    ? "text-zinc-900 dark:text-white"
                    : link.disabled
                    ? "text-zinc-400 dark:text-white/30"
                    : "text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-white/40"
                  )}
                />
                {isActive && (
                  <span className="animate-in fade-in zoom-in duration-300">
                    {link.label}
                  </span>
                )}
              </span>
            );

            // If disabled, wrap in div instead of Link, and optional tooltip
            if (link.disabled) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <div className="relative z-10">{content}</div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {link.disabledTooltip || "Not available"}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={link.href}
                href={dynamicHref}
                className="relative z-10"
              >
                {content}

                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </TooltipProvider>
    </div>
  );
}
