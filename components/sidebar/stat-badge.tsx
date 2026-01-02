"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatBadgeProps {
  value: number | string;
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
  className?: string;
}

export function StatBadge({
  value,
  variant = "secondary",
  className,
}: StatBadgeProps) {
  const variantStyles = {
    default: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
    secondary: "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100",
    outline:
      "border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300",
    success:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    warning:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-2 py-0 text-[10px] font-semibold leading-5 tabular-nums",
        variantStyles[variant],
        className
      )}
    >
      {value}
    </Badge>
  );
}
