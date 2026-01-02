"use client";

import { useEffect, useState } from "react";
import { getUserStatsAction } from "@/app/actions/contribution-actions";
import { TrendingUp, Wallet, Trophy, Crown } from "lucide-react";
import { BrandNewStatsModal } from "@/components/dashboard/brand-new-stats-modal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumStatsPillProps {
  farewellId: string;
  userId: string;
  theme?: "dark" | "glass" | "light"; // Theme options
}

export function PremiumStatsPill({
  farewellId,
  userId,
  theme = "glass",
}: PremiumStatsPillProps) {
  const [stats, setStats] = useState({
    rank: 0,
    percentile: 0,
    totalContribution: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      getUserStatsAction(farewellId, userId).then(setStats);
    }
  }, [farewellId, userId]);

  if (stats.totalContribution === 0) return null;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)",
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setModalOpen(true)}
        className={cn(
          "relative flex items-center gap-0 overflow-hidden rounded-full transition-all duration-300 group",
          theme === "glass" &&
            "bg-zinc-800/50 backdrop-blur-xl border border-white/10 shadow-lg",
          theme === "dark" && "bg-black border border-white/5",
          theme === "light" && "bg-white text-black border border-gray-200"
        )}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Rank Section */}
        <div className="flex items-center gap-2 px-3 py-1.5 sm:border-r border-white/5 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/40 blur-[6px] rounded-full animate-pulse" />
            <Crown className="w-3.5 h-3.5 text-emerald-400 relative z-10" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
            #{stats.rank}
          </span>
        </div>

        {/* Amount Section (Hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 relative z-10">
          <Wallet
            className={cn(
              "w-3 h-3 text-zinc-400 group-hover:text-white transition-colors"
            )}
          />
          <span
            className={cn(
              "text-xs font-semibold tabular-nums tracking-tight",
              theme === "light" ? "text-zinc-800" : "text-white"
            )}
          >
            ₹{stats.totalContribution.toLocaleString()}
          </span>
        </div>
      </motion.button>

      <BrandNewStatsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stats={stats}
        transactions={[]}
        farewellId={farewellId}
      />
    </>
  );
}
