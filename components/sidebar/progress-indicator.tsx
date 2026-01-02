"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressIndicator({
  current,
  total,
  className,
  showPercentage = false,
}: ProgressIndicatorProps) {
  const percentage =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 rounded-full",
            percentage >= 100
              ? "bg-emerald-500"
              : percentage >= 50
              ? "bg-blue-500"
              : "bg-amber-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage text */}
      {showPercentage && (
        <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 tabular-nums min-w-[32px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}
