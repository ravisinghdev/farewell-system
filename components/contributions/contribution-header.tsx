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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3 text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
