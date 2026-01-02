import {
  getUserStatsAction,
  getPublicRecentTransactionsAction,
} from "@/app/actions/contribution-actions";
import { useState, useEffect } from "react";
import { TrendingUp, Wallet, Trophy } from "lucide-react";
import { BrandNewStatsModal } from "@/components/dashboard/brand-new-stats-modal";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarStatsPillProps {
  farewellId: string;
  userId: string;
}

export function NavbarStatsPill({ farewellId, userId }: NavbarStatsPillProps) {
  const [stats, setStats] = useState({
    rank: 0,
    percentile: 0,
    totalContribution: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    if (userId) {
      const statsData = await getUserStatsAction(farewellId, userId);
      setStats(statsData);

      // Fetch global recent transactions (limit 5 for the modal)
      console.log("Fetching transactions for farewell:", farewellId);
      const data = await getPublicRecentTransactionsAction(farewellId, 5);
      console.log("Fetched transactions:", data);
      setTransactions(data);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime Subscription (Global for this Farewell)
    const supabase = createClient();
    const channel = supabase
      .channel(`contributions-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, userId]);

  if (stats.totalContribution === 0) return null;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setModalOpen(true)}
        className={cn(
          "relative flex items-center gap-3",
          "bg-white/5 hover:bg-white/10 border border-white/10",
          "rounded-full py-1.5 pl-3 pr-4",
          "backdrop-blur-xl shadow-sm transition-all duration-300",
          "group overflow-hidden"
        )}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

        <div className="flex items-center gap-2 border-r border-white/10 pr-3">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-sm rounded-full" />
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 relative z-10" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Rank
            </span>
            <span className="text-xs font-bold text-emerald-400">
              #{stats.rank}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-sm rounded-full" />
            <Wallet className="w-3.5 h-3.5 text-yellow-400 relative z-10" />
          </div>
          <span className="text-xs font-bold text-foreground group-hover:text-yellow-200 transition-colors">
            ₹{stats.totalContribution.toLocaleString()}
          </span>
        </div>
      </motion.button>

      <BrandNewStatsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stats={stats}
        transactions={transactions}
        farewellId={farewellId}
      />
    </>
  );
}
