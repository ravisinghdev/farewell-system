"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Plus,
  Wallet,
  CreditCard,
  MoreHorizontal,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  Share2,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  History,
} from "lucide-react";
import { GradientCard } from "@/components/ui/gradient-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, subDays } from "date-fns";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { IconCash } from "@tabler/icons-react";
import { getContributionRankAction } from "@/app/actions/contribution-actions";

interface Contribution {
  id: string;
  amount: number;
  method: "upi" | "cash" | "bank_transfer" | "stripe" | "razorpay";
  status:
    | "pending"
    | "verified"
    | "rejected"
    | "approved"
    | "paid_pending_admin_verification"
    | "awaiting_payment";
  created_at: string;
  transaction_id?: string;
  user_id?: string;
  users?: {
    full_name: string;
    avatar_url?: string;
  };
  metadata?: {
    is_anonymous?: boolean;
    [key: string]: any;
  };
}

interface ContributionDashboardProps {
  initialContributions: Contribution[];
  initialStats: { total: number; contribution_count?: number };
  farewellId: string;
  userId: string;
  isAdmin: boolean;
  userName: string;
  assignedAmount?: number;
  budgetGoal?: number;
}

export function ContributionDashboard({
  initialContributions,
  initialStats,
  farewellId,
  userId,
  isAdmin,
  userName,
  assignedAmount = 0,
  budgetGoal = 0,
}: ContributionDashboardProps) {
  const [contributions, setContributions] =
    useState<Contribution[]>(initialContributions);
  const [stats, setStats] = useState(initialStats);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rankData, setRankData] = useState({ rank: 0, percentile: 0 });
  const observerTarget = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch rank on mount
  useEffect(() => {
    if (userId) {
      getContributionRankAction(farewellId, userId).then((data) => {
        setRankData(data);
      });
    }
  }, [farewellId, userId, contributions]);

  // Sync state with props when data is re-fetched/updated from server
  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  // Filter contributions based on search query
  const filteredContributions = contributions.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const isAnonymous = c.metadata?.is_anonymous === true;
    const userData = Array.isArray(c.users) ? c.users[0] : c.users;
    const userName = isAnonymous
      ? "Anonymous"
      : userData?.full_name || "Unknown User";

    const transactionId = c.transaction_id || "";
    const method = c.method || "";

    return (
      userName.toLowerCase().includes(query) ||
      transactionId.toLowerCase().includes(query) ||
      method.toLowerCase().includes(query)
    );
  });

  // Calculate display amount based on role and stats
  useEffect(() => {
    // If Admin AND Budget Goal is set, show Total Collected.
    // Otherwise (Admin with 0 goal, or Student), show Personal Total.
    if (isAdmin && budgetGoal > 0) {
      setDisplayAmount(stats.total);
    } else {
      const myTotal = contributions
        .filter(
          (c) =>
            (c.status === "approved" || c.status === "verified") &&
            c.user_id === userId
        ) // Ensure we count only MY contributions
        .reduce((sum, c) => sum + Number(c.amount), 0);
      setDisplayAmount(myTotal);
    }
  }, [isAdmin, stats, contributions, budgetGoal, userId]);

  // Generate chart data
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTotal = contributions
      .filter(
        (c) =>
          format(new Date(c.created_at), "yyyy-MM-dd") === dateStr &&
          (c.status === "approved" || c.status === "verified")
      )
      .reduce((sum, c) => sum + Number(c.amount), 0);
    return {
      name: format(date, "MMM d"),
      amount: dayTotal,
    };
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime-contributions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: isAdmin
            ? `farewell_id=eq.${farewellId}`
            : `farewell_id=eq.${farewellId}&user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: fullContribution } = await supabase
              .from("contributions")
              .select("*, users:user_id(full_name, avatar_url)")
              .eq("id", payload.new.id)
              .single();

            if (fullContribution) {
              setContributions((prev) => {
                if (prev.some((c) => c.id === fullContribution.id)) return prev;
                return [fullContribution, ...prev];
              });

              if (fullContribution.status === "approved" && isAdmin) {
                setStats((prev) => ({
                  total: prev.total + Number(fullContribution.amount),
                  contribution_count: (prev.contribution_count || 0) + 1,
                }));
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const { data: fullContribution } = await supabase
              .from("contributions")
              .select("*, users:user_id(full_name, avatar_url)")
              .eq("id", payload.new.id)
              .single();

            if (fullContribution) {
              setContributions((prev) =>
                prev.map((c) =>
                  c.id === fullContribution.id ? fullContribution : c
                )
              );
              if (isAdmin) {
                if (
                  fullContribution.status === "approved" &&
                  payload.old.status !== "approved"
                ) {
                  setStats((prev) => ({
                    total: prev.total + Number(fullContribution.amount),
                    contribution_count: (prev.contribution_count || 0) + 1,
                  }));
                } else if (
                  fullContribution.status !== "approved" &&
                  payload.old.status === "approved"
                ) {
                  setStats((prev) => ({
                    total: prev.total - Number(fullContribution.amount),
                    contribution_count: Math.max(
                      0,
                      (prev.contribution_count || 0) - 1
                    ),
                  }));
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, farewellId, userId, isAdmin]);

  // Infinite Scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const currentLength = contributions.length;
    const { data, error } = await supabase
      .from("contributions")
      .select("*, users:user_id(full_name, avatar_url)")
      .eq("farewell_id", farewellId)
      .match(isAdmin ? {} : { user_id: userId })
      .order("created_at", { ascending: false })
      .range(currentLength, currentLength + 9);

    if (error) {
      console.error("Error loading more:", error);
    } else {
      if (data.length < 10) {
        setHasMore(false);
      }
      setContributions((prev) => {
        const uniqueMap = new Map(prev.map((c) => [c.id, c]));
        data.forEach((c) => uniqueMap.set(c.id, c));
        return Array.from(uniqueMap.values()).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }
    setIsLoadingMore(false);
  }, [
    contributions.length,
    hasMore,
    isLoadingMore,
    supabase,
    farewellId,
    isAdmin,
    userId,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  const recentTransactions = contributions.slice(0, 5);

  // Logic: If Admin & Goal > 0 -> Show Class Progress. Else -> Show Personal Progress.
  const showAdminStats = isAdmin && budgetGoal > 0;

  const targetAmount = showAdminStats ? budgetGoal : assignedAmount;
  const progressPercentage =
    targetAmount > 0 ? (displayAmount / targetAmount) * 100 : 0;

  const labelTotal = showAdminStats ? "Total Collected" : "My Contribution";
  const labelTarget = showAdminStats ? "Class Target" : "My Target";

  const handleShare = async () => {
    const text = `I'm Rank #${
      rankData.rank
    } in the farewell contributions! Total: ₹${displayAmount.toLocaleString()}. Check it out!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Farewell Contribution",
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert("Profile link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Actions Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
            Financial Dashboard
          </h2>
          <p className="text-white/50 text-sm">
            Real-time overview of all farewell contributions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 w-11 h-11"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#0a0a0a] border-white/10 text-white backdrop-blur-xl rounded-xl p-2"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-white/40 mb-2">
                Options
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg px-3 py-2 text-sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            className="rounded-full bg-white/10 border border-white/5 text-white hover:bg-white/20 font-medium px-6 h-11 transition-all"
          >
            <Link
              href={`/dashboard/${farewellId}/contributions/payment/methods`}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Manage Methods
            </Link>
          </Button>

          <Button
            asChild
            className="rounded-full bg-white text-black hover:bg-emerald-50 hover:text-emerald-950 font-bold px-6 h-11 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105"
          >
            <Link href={`/dashboard/${farewellId}/contributions/payment`}>
              <Plus className="w-5 h-5 mr-2" /> Add Contribution
            </Link>
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout - REPLACED */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
        {/* Main Wallet Card - Spans 4 cols, 2 rows */}
        <div className="xl:col-span-4 xl:row-span-2">
          <GradientCard
            variant="gold"
            className="relative overflow-hidden h-full flex flex-col justify-between p-8 border border-white/10 rounded-3xl group shadow-2xl min-h-[420px]"
          >
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-600/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none mix-blend-screen" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-black/20 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/20 backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-yellow-100 uppercase tracking-wider">
                      Live Balance
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <p className="text-white/60 font-medium text-sm uppercase tracking-widest pl-1">
                  {labelTotal}
                </p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-6xl font-bold tracking-tighter text-white drop-shadow-xl">
                    ₹{displayAmount.toLocaleString()}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex gap-3 relative z-10 pt-6 border-t border-white/10 mt-auto">
              <div className="flex-1 bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-black/30 transition-colors group/stat">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 group-hover/stat:text-white/60 transition-colors">
                  {labelTarget}
                </p>
                <p className="text-xl font-bold text-white/90">
                  ₹{targetAmount.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-black/30 transition-colors group/stat">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover/stat:text-white/60 transition-colors">
                    Coverage
                  </p>
                  {progressPercentage >= 100 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                  )}
                </div>
                <p className="text-xl font-bold text-white/90">
                  {progressPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </GradientCard>
        </div>

        {/* Analytics Chart - Spans 5 cols, 2 rows */}
        <div className="xl:col-span-5 xl:row-span-2">
          <GlassCard className="h-full flex flex-col p-6 rounded-3xl border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> Analytics
              </h3>
            </div>
            <div className="flex-1 w-full min-h-0 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-20 pointer-events-none" />
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorAmount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#c084fc"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Global Rank Card - Spans 3 cols, 1 row */}
        <div className="xl:col-span-3 xl:row-span-1">
          <GlassCard className="h-full relative overflow-hidden group p-0 border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-2xl rounded-3xl min-h-[200px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-700/20 opacity-50 group-hover:opacity-100 transition-opacity" />
            {rankData.rank > 0 ? (
              <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                    Global Rank
                  </p>
                  <div className="bg-white/10 p-1.5 rounded-lg text-white">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-white">
                      #{rankData.rank}
                    </span>
                    <span className="text-sm font-medium text-white/60 mb-1.5">
                      of {stats.contribution_count || contributions.length}
                    </span>
                  </div>
                  <div className="w-full bg-black/20 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div
                      className="bg-white/90 h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                      style={{ width: `${rankData.percentile}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/40 mt-2 text-right font-medium uppercase tracking-wider">
                    Top {rankData.percentile}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center">
                <p className="text-white/40 text-sm font-medium">
                  Rank not available yet
                </p>
                <p className="text-white/20 text-xs">
                  Start contributing to see your rank
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Recent Activity List - Spans 3 cols, 1 row */}
        <div className="xl:col-span-3 xl:row-span-1">
          <div className="h-full bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all flex flex-col min-h-[200px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 pointer-events-none">
              <History className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="relative z-10 flex w-full justify-between items-center mb-4">
              <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-wider">
                Recent
              </p>
              <Link
                href={`/dashboard/${farewellId}/contributions/history`}
                className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-wider font-bold"
              >
                See All
              </Link>
            </div>

            <div className="relative z-10 space-y-3 flex-1">
              {recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 3).map((tx, i) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-emerald-500/10">
                        {(Array.isArray(tx.users)
                          ? tx.users[0]?.full_name
                          : tx.users?.full_name
                        )?.charAt(0) || "?"}
                      </div>
                      <span className="text-xs text-emerald-100 font-medium truncate max-w-[80px]">
                        {(Array.isArray(tx.users)
                          ? tx.users[0]?.full_name
                          : tx.users?.full_name) || "User"}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white">
                      +₹{tx.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/30 text-xs">No recent txns</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid - Spans 3 cols, 1 row */}
        <div className="xl:col-span-3 xl:row-span-1">
          <GlassCard className="h-full flex flex-col justify-center p-6 rounded-3xl border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-2xl">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3 h-full">
              <Button
                variant="outline"
                asChild
                className="justify-center bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl group flex-col gap-1 h-full min-h-[80px]"
              >
                <Link href={`/dashboard/${farewellId}/contributions/receipt`}>
                  <Download className="w-5 h-5 text-white/60 group-hover:text-white mb-1 transition-colors" />
                  <span className="text-[10px] font-medium">Receipt</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="justify-center bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl group flex-col gap-1 h-full min-h-[80px] cursor-pointer"
              >
                <Share2 className="w-5 h-5 text-white/60 group-hover:text-white mb-1 transition-colors" />
                <span className="text-[10px] font-medium">Share</span>
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* All Transactions Table (Full Width) */}
      <GlassCard className="min-h-[500px] border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-2xl rounded-3xl p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-white/5 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              All Transactions
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                {contributions.length}
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors" />
              <Input
                placeholder="Search by name, ID, or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/20 border-white/5 text-white placeholder:text-white/20 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:bg-black/40 h-10 transition-all font-medium text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white/5 border-white/5 text-white hover:bg-white/10 w-10 h-10 shrink-0"
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white/5 border-white/5 text-white hover:bg-white/10 w-10 h-10 shrink-0"
            >
              <ArrowDownLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-0">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
            <div className="col-span-6 md:col-span-4 pl-2">User details</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">Date</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">
              Method
            </div>
            <div className="col-span-6 md:col-span-2 text-right pr-2">
              Amount
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredContributions.map((c) => {
              const isAnonymous = c.metadata?.is_anonymous === true;
              const userData = Array.isArray(c.users) ? c.users[0] : c.users;
              const userName = isAnonymous
                ? "Anonymous"
                : userData?.full_name || "Unknown User";
              const userAvatar = isAnonymous ? null : userData?.avatar_url;

              return (
                <div
                  key={c.id}
                  className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.03] transition-colors group border-b border-white/[0.02] last:border-0"
                >
                  <div className="col-span-6 md:col-span-4 flex items-center gap-4">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName || "User"}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/10 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-white font-bold ring-1 ring-white/5">
                        {userName ? userName.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate group-hover:text-white transition-colors">
                        {userName}
                      </p>
                      <p
                        className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${
                          c.status === "verified" || c.status === "approved"
                            ? "text-emerald-500"
                            : "text-amber-500"
                        }`}
                      >
                        {c.status === "paid_pending_admin_verification"
                          ? "Verification Pending"
                          : c.status}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 md:col-span-3 hidden md:block text-white/40 text-xs font-medium">
                    {format(new Date(c.created_at), "MMM d, yyyy")}{" "}
                    <span className="text-white/20 ml-1">
                      {format(new Date(c.created_at), "h:mm a")}
                    </span>
                  </div>

                  <div className="col-span-3 md:col-span-3 hidden md:block">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white/70 uppercase tracking-wider shadow-sm">
                      {c.method === "bank_transfer"
                        ? "Bank"
                        : c.method.replace("_", " ")}
                    </span>
                  </div>

                  <div className="col-span-6 md:col-span-2 text-right">
                    <p className="text-white font-bold text-sm tracking-tight group-hover:scale-105 transition-transform">
                      +₹{c.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Loader */}
          <div
            ref={observerTarget}
            className="py-6 text-center border-t border-white/5"
          >
            {isLoadingMore && (
              <p className="text-white/40 text-xs font-medium animate-pulse uppercase tracking-widest">
                Loading more...
              </p>
            )}
            {!hasMore && contributions.length > 0 && (
              <p className="text-white/10 text-[10px] uppercase tracking-[0.3em]">
                End of list
              </p>
            )}
            {contributions.length === 0 && !isLoadingMore && (
              <div className="py-12 flex flex-col items-center justify-center text-white/30">
                <Search className="w-12 h-12 opacity-20 mb-4" />
                <p className="text-sm">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
