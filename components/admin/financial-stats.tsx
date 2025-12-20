"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, TrendingUp, Users, Clock, Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// -------------------------------
// Animated Number Utility
// -------------------------------
function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const initial = value;

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setValue(initial + (target - initial) * easeOutQuart);

      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return Math.round(value);
}

// -------------------------------
// Circular Progress Component
// -------------------------------
function CircularProgress({ progress }: { progress: number }) {
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
      {/* Background Circle */}
      <svg
        className="absolute w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground"
        />
      </svg>

      {/* Progress Circle */}
      <svg
        className="absolute w-full h-full transform -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" /> {/* Emerald-400 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue-500 */}
          </linearGradient>
        </defs>
      </svg>

      {/* Text */}
      <div className="flex flex-col items-center z-10">
        <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tighter drop-shadow-sm">
          {progress.toFixed(0)}%
        </span>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Funded
        </span>
      </div>
    </div>
  );
}

// -------------------------------
// Premium Stat Card Component
// -------------------------------
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  loading,
  delay = 0,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: any;
  loading?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="
      relative p-5 rounded-2xl border border-border/50
      bg-card/50
      backdrop-blur-md shadow-sm
      overflow-hidden group transition-all duration-300
      hover:border-border hover:shadow-md hover:-translate-y-1
    "
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Mesh Gradient Background (Subtle) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {label}
          </div>
          <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight cursor-default break-words">
                  <span className="block">{value}</span>
                  {loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {subtext && (
            <div className="text-xs text-muted-foreground">{subtext}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------
// MAIN COMPONENT
// -------------------------------
interface FinancialStatsProps {
  initialStats: {
    collectedAmount: number;
    totalContributors: number;
    pendingCount: number;
    targetAmount?: number;
  };
  farewellId: string;
}

export function FinancialStats({
  initialStats,
  farewellId,
}: FinancialStatsProps) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  // Sync with incoming props
  useEffect(() => setStats(initialStats), [initialStats]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const fetchLatestStats = async () => {
      setLoading(true);
      const { getFinancialStatsAction } = await import(
        "@/app/actions/contribution-actions"
      );
      const newStats = await getFinancialStatsAction(farewellId);
      setStats(newStats as any);
      setLoading(false);
    };

    // Channel for Contributions, Farewells, and Ledger
    const channel = supabase
      .channel(`financials-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          console.log("Realtime: Contribution update detected");
          fetchLatestStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          console.log("Realtime: Ledger update detected");
          fetchLatestStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "farewells",
          filter: `id=eq.${farewellId}`,
        },
        () => {
          console.log("Realtime: Farewell target update detected");
          fetchLatestStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  // ===================================
  // Animated Numbers
  // ===================================
  // @ts-ignore
  const totalSpent = stats.totalSpent || 0;
  // @ts-ignore
  const netBalance = stats.netBalance ?? stats.collectedAmount;

  const animatedCollected = useAnimatedNumber(stats.collectedAmount);
  // @ts-ignore
  const animatedBalance = useAnimatedNumber(netBalance);
  // @ts-ignore
  const animatedSpent = useAnimatedNumber(totalSpent);

  const animatedContributors = useAnimatedNumber(stats.totalContributors);
  const animatedPending = useAnimatedNumber(stats.pendingCount);
  const animatedTarget = useAnimatedNumber(stats.targetAmount ?? 0);

  // Progress %
  const progress =
    stats.targetAmount && stats.targetAmount > 0
      ? Math.min((netBalance / stats.targetAmount) * 100, 100)
      : 0;

  // Variance
  const variance =
    stats.targetAmount && stats.targetAmount > 0
      ? stats.targetAmount - netBalance
      : 0;

  const varianceLabel =
    variance > 0
      ? `Need ₹${variance.toLocaleString()} more`
      : variance < 0
      ? `Surplus of ₹${Math.abs(variance).toLocaleString()}`
      : "Target Met Exactly";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================================
            Executive KPI Card (Main Funding Progress)
           ================================ */}
        <div className="lg:col-span-1 relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-xl flex flex-col items-center justify-center text-center group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-emerald-500/20 transition-all duration-700" />

          <CircularProgress progress={progress} />

          <div className="mt-6 space-y-1">
            <h3 className="text-xl font-semibold text-foreground">
              Current Balance
            </h3>
            <p className="text-sm text-muted-foreground">{varianceLabel}</p>
            <div className="text-2xl font-bold mt-2">
              ₹{animatedBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* ================================
            Stat Cards Grid
           ================================ */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
          <StatCard
            label="Total Collected"
            value={`₹${animatedCollected.toLocaleString()}`}
            subtext="Gross before expenses"
            icon={TrendingUp}
            loading={loading}
            delay={100}
          />

          <StatCard
            label="Total Spent"
            value={`₹${animatedSpent.toLocaleString()}`}
            subtext="Approved duties"
            icon={Clock} // Should be a CreditCard or DollarSign icon really
            loading={loading}
            delay={150}
          />

          <StatCard
            label="Target Goal"
            value={`₹${animatedTarget.toLocaleString()}`}
            subtext="Budget estimate"
            icon={Target}
            loading={loading}
            delay={200}
          />

          <StatCard
            label="Pending Review"
            value={animatedPending}
            subtext="Awaiting verification"
            icon={Clock}
            loading={loading}
            delay={400}
          />
        </div>
      </div>
    </div>
  );
}
