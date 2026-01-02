"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

// --- Glass Card ---
export function GlassCard({
  children,
  className,
  contentClassName,
  hoverEffect = true,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  hoverEffect?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-all duration-300",
        hoverEffect &&
          "hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1",
        className
      )}
    >
      {/* Noise Texture (Optional sub-layer) */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      <div className={cn("relative z-10 p-5", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

// --- Stat Widget ---
interface StatWidgetProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  colorClass?: string; // e.g. "text-emerald-400"
  bgClass?: string; // e.g. "bg-emerald-500/10"
}

export function StatWidget({
  label,
  value,
  subtext,
  icon: Icon,
  colorClass = "text-primary",
  bgClass = "bg-primary/10",
}: StatWidgetProps) {
  return (
    <GlassCard className="flex flex-col justify-between h-full min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className={cn("p-2.5 rounded-xl", bgClass, colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        {/* Optional decorative element */}
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            colorClass.replace("text-", "bg-")
          )}
        />
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-medium text-muted-foreground/80">
            {label}
          </p>
          {subtext && (
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// --- Quick Action Button ---
interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  color?: string; // Tailwind color class prefix e.g 'pink'
}

export function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  color = "blue",
}: QuickActionProps) {
  // Construct dynamic classes safely or use a mapping. For simplicity, enforcing specific classes.
  // Ideally, use a mapped object for colors to avoid arbitrary class injection if strict.
  // Using inline style or predefined classes is safer. Let's assume standard tailwind colors.

  return (
    <Link href={href} className="block group h-full">
      <div
        className={cn(
          "relative h-full p-4 rounded-2xl border border-white/5 bg-white/5 transition-all duration-300 overflow-hidden",
          "hover:bg-white/10 hover:border-white/10 hover:shadow-lg group-hover:-translate-y-0.5"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
            `bg-${color}-500`
          )}
        />
        <div className="flex flex-col items-center text-center gap-3 relative z-10">
          <div
            className={cn(
              "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
              `bg-${color}-500/10 text-${color}-500`
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <span className="font-semibold block text-sm">{label}</span>
            {description && (
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                {description}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- Live Ticker Item ---
export function LiveTickerItem({
  icon: Icon,
  text,
  time,
}: {
  icon: LucideIcon;
  text: string;
  time: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-muted-foreground whitespace-nowrap mx-2">
      <Icon className="h-3 w-3 text-primary animate-pulse" />
      <span suppressHydrationWarning>{text}</span>
      <span suppressHydrationWarning className="opacity-50">
        · {time}
      </span>
    </div>
  );
}
