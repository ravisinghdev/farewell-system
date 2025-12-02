"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    },
    {
      href: `/dashboard/${farewellId}/contributions/history`,
      label: "History",
    },
    {
      href: `/dashboard/${farewellId}/contributions/payment`,
      label: "Payment",
    },
    {
      href: `/dashboard/${farewellId}/contributions/receipt`,
      label: "Receipts",
    },
    {
      href: `/dashboard/${farewellId}/contributions/analytics`,
      label: "Analytics",
    },
    {
      href: `/dashboard/${farewellId}/contributions/leaderboard`,
      label: "Leaderboard",
    },
    {
      href: `/dashboard/${farewellId}/budget`,
      label: "Budget",
    },
  ];

  if (isAdmin) {
    links.push({
      href: `/dashboard/${farewellId}/contributions/manage`,
      label: "Manage",
    });
  }

  return (
    <div className="w-full overflow-x-auto pb-2 mb-6 scrollbar-hide ">
      <nav className="flex items-center gap-1 p-1 bg-white/5 w-fit rounded-full border border-white/10 backdrop-blur-md mx-auto md:mx-0">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
