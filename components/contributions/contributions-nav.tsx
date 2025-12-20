"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  History,
  PieChart,
  PiggyBank,
  Receipt,
  Shield,
  Trophy,
  Wallet,
} from "lucide-react";

export function ContributionsNav({
  farewellId,
  isAdmin = false,
}: {
  farewellId: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const links = [
    {
      href: `/dashboard/${farewellId}/contributions/overview`,
      label: "Overview",
      icon: PiggyBank,
    },
    {
      href: `/dashboard/${farewellId}/contributions/payment`,
      label: "Payment",
      icon: Wallet,
    },
    {
      href: `/dashboard/${farewellId}/contributions/receipt`,
      label: "Receipts",
      icon: Receipt,
    },
    {
      href: `/dashboard/${farewellId}/contributions/history`,
      label: "History",
      icon: History,
    },
    {
      href: `/dashboard/${farewellId}/contributions/analytics`,
      label: "Analytics",
      icon: PieChart,
    },
    {
      href: `/dashboard/${farewellId}/contributions/leaderboard`,
      label: "Leaderboard",
      icon: Trophy,
    },
  ];

  if (isAdmin) {
    links.push({
      href: `/dashboard/${farewellId}/budget`,
      label: "Budget",
      icon: Wallet,
    });
    links.push({
      href: `/dashboard/${farewellId}/contributions/manage`,
      label: "Manage",
      icon: Shield,
    });
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-black/40 w-fit max-w-full overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} className="relative z-10">
              <span
                className={cn(
                  "relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap",
                  isActive
                    ? "text-zinc-900 dark:text-white"
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

              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
