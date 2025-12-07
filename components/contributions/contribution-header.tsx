"use client";

import { useFarewell } from "@/components/providers/farewell-provider";
import { cn } from "@/lib/utils";
import {
  Wallet,
  PieChart,
  Receipt,
  Trophy,
  History,
  Shield,
  PiggyBank,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ContributionHeaderProps {
  title: string;
  description?: string;
  farewellId: string;
}

export function ContributionHeader({
  title,
  description,
  farewellId,
}: ContributionHeaderProps) {
  const pathname = usePathname();
  const { isAdmin } = useFarewell();

  const navItems = [
    {
      href: `/dashboard/${farewellId}/contributions`,
      label: "Overview",
      icon: PiggyBank,
    },
    {
      href: `/dashboard/${farewellId}/contributions/payment`,
      label: "Pay",
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
      label: "Top",
      icon: Trophy,
    },
  ];

  if (isAdmin) {
    navItems.push({
      href: `/dashboard/${farewellId}/budget`,
      label: "Budget",
      icon: Wallet,
    });
    navItems.push({
      href: `/dashboard/${farewellId}/contributions/manage`,
      label: "Manage",
      icon: Shield,
    });
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Title Section with Gradient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-500">
              <Wallet className="w-6 h-6" />
            </span>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground ml-1">{description}</p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
        <div className="p-1 rounded-xl bg-muted/40 border border-white/5 flex items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 rounded-lg text-xs font-medium h-9 px-3 transition-all duration-300",
                    isActive
                      ? "bg-background shadow-sm text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn("w-3.5 h-3.5", isActive && "text-primary")}
                  />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
