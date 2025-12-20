"use client";

import { useFarewell } from "@/components/providers/farewell-provider";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

interface ContributionHeaderProps {
  title: string;
  description?: string;
  farewellId: string;
  minimal?: boolean;
}

export function ContributionHeader({
  title,
  description,
  farewellId,
  minimal = false,
}: ContributionHeaderProps) {
  const pathname = usePathname();
  const { isAdmin } = useFarewell();

  return (
    <div className="space-y-6 mb-8 w-full">
      {/* Title Section with Gradient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 text-zinc-900 dark:text-white">
            <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500">
              <Wallet className="w-6 h-6" />
            </span>
            {title}
          </h1>
          {description && (
            <p className="text-zinc-500 dark:text-zinc-400 ml-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
