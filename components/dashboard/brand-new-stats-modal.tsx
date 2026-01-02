"use client";

// recompile
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  X,
  Trophy,
  TrendingUp,
  Sparkles,
  Wallet,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggler";

import { formatDistanceToNow } from "date-fns";

interface StatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    rank: number;
    percentile: number;
    totalContribution: number;
  };
  transactions: any[];
  farewellId: string;
}

export function BrandNewStatsModal({
  open,
  onOpenChange,
  stats,
  transactions = [],
  farewellId,
}: StatsModalProps) {
  const [accent, setAccent] = useState<"gold" | "violet" | "emerald" | "blue">(
    "gold"
  );

  // Theme Config - adjusted for both light/dark compatibility
  const themes = {
    gold: {
      primary: "text-amber-600 dark:text-yellow-400",
      bg: "bg-amber-500 dark:bg-yellow-500",
      border: "border-amber-500/20 dark:border-yellow-500/20",
      glow: "shadow-amber-500/20 dark:shadow-yellow-500/20",
      gradient: "from-amber-400 to-orange-500",
      icon: "text-amber-600 dark:text-yellow-400",
    },
    violet: {
      primary: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500",
      border: "border-violet-500/20",
      glow: "shadow-violet-500/20",
      gradient: "from-violet-400 to-fuchsia-500",
      icon: "text-violet-600 dark:text-violet-400",
    },
    emerald: {
      primary: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/20",
      gradient: "from-emerald-400 to-teal-500",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    blue: {
      primary: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500",
      border: "border-blue-500/20",
      glow: "shadow-blue-500/20",
      gradient: "from-blue-400 to-cyan-500",
      icon: "text-blue-600 dark:text-blue-400",
    },
  };

  const currentTheme = themes[accent];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 border-none bg-transparent shadow-none max-w-sm sm:max-w-md overflow-hidden"
      >
        <DialogTitle className="sr-only">Your Contribution Stats</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full rounded-[32px] overflow-hidden bg-background border border-border shadow-2xl"
        >
          {/* Minimal Header Background */}
          <div
            className={cn(
              "absolute top-0 left-0 w-full h-32 opacity-10 bg-gradient-to-b",
              currentTheme.gradient,
              "to-transparent pointer-events-none"
            )}
          />

          {/* Theme Selector */}
          <div className="absolute top-5 left-6 flex gap-2 z-30 items-center">
            <ThemeToggle className="w-8 h-8 rounded-full border-white/10 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-foreground backdrop-blur-md" />
            <div className="w-px h-4 bg-border mx-1" />
            {(Object.keys(themes) as Array<keyof typeof themes>).map((t) => (
              <button
                key={t}
                onClick={() => setAccent(t)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  themes[t].bg,
                  accent === t
                    ? "ring-2 ring-foreground/20 scale-110"
                    : "opacity-50 hover:opacity-100"
                )}
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute cursor-pointer top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-20 backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Content */}
          <div className="relative pt-12 px-8 pb-6 text-center flex flex-col items-center z-10">
            <div className="relative mb-4">
              <div
                className={cn(
                  "absolute inset-0 blur-xl opacity-20 rounded-full animate-pulse bg-gradient-to-tr",
                  currentTheme.gradient
                )}
              />
              <div className="relative h-20 w-20 bg-gradient-to-tr from-card to-background rounded-2xl border border-border flex items-center justify-center shadow-2xl skew-y-3 transform transition-transform hover:skew-y-0 duration-500">
                <Trophy
                  className={cn("w-10 h-10 drop-shadow-md", currentTheme.icon)}
                />
              </div>
              <div
                className={cn(
                  "absolute -bottom-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/10 shadow-lg bg-gradient-to-r",
                  currentTheme.gradient
                )}
              >
                Top {Math.max(1, 100 - stats.percentile)}%
              </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
              Your Impact
            </h2>
            <p className="text-muted-foreground text-sm">
              Keep climbing the leaderboard!
            </p>
          </div>

          {/* Main Stats Grid */}
          <div className="px-6 pb-6 space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-3">
              {/* Global Rank Card */}
              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 hover:bg-muted/50 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors bg-background group-hover:bg-background/80"
                    )}
                  >
                    <TrendingUp className={cn("w-4 h-4", currentTheme.icon)} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto bg-background",
                      currentTheme.primary
                    )}
                  >
                    Rising
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">
                    Global Rank
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    #{stats.rank}
                  </span>
                </div>
              </div>

              {/* Contribution Card */}
              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 hover:bg-muted/50 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-background rounded-lg group-hover:bg-background/80 transition-colors">
                    <Wallet className={cn("w-4 h-4", currentTheme.icon)} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-0.5">
                    Contributed
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    ₹{stats.totalContribution.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity List */}
            <div className="bg-muted/20 rounded-2xl p-1 border border-border/50">
              <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Recent Updates
                </span>
                <Sparkles
                  className={cn("w-3 h-3 opacity-50", currentTheme.icon)}
                />
              </div>
              <div className="p-1 space-y-1">
                {transactions.length > 0 ? (
                  transactions.map((item) => {
                    const userData = Array.isArray(item.users)
                      ? item.users[0]
                      : item.users;
                    const name = userData?.full_name || "Someone";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                              currentTheme.bg
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-foreground font-medium">
                              {name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.status === "verified"
                                ? "Contributed"
                                : "Pledged"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          {item.amount && (
                            <span className="text-xs text-foreground/80 font-mono">
                              +₹{Number(item.amount).toLocaleString()}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No recent contributions found.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-colors shadow-lg flex items-center justify-center gap-2 group">
              Customer View Leaderboard
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
