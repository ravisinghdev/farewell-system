"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  ArrowUpRight,
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
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Contribution {
  id: string;
  amount: number;
  method: "upi" | "cash" | "bank_transfer" | "stripe" | "razorpay";
  status: "pending" | "verified" | "rejected";
  created_at: string;
  transaction_id?: string;
  user_id?: string;
  users?: {
    name: string;
    avatar_url?: string;
  };
}

interface ContributionDashboardProps {
  initialContributions: Contribution[];
  initialStats: { total: number };
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
  const observerTarget = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Filter contributions based on search query
  const filteredContributions = contributions.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName =
      (Array.isArray(c.users) ? c.users[0]?.name : c.users?.name) || "";
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
    if (isAdmin) {
      setDisplayAmount(stats.total);
    } else {
      const myTotal = contributions
        .filter((c) => c.status !== "rejected")
        .reduce((sum, c) => sum + Number(c.amount), 0);
      setDisplayAmount(myTotal);
    }
  }, [isAdmin, stats, contributions]);

  // Generate chart data
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTotal = contributions
      .filter(
        (c) =>
          format(new Date(c.created_at), "yyyy-MM-dd") === dateStr &&
          c.status === "verified"
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
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newContribution = payload.new as Contribution;
            setContributions((prev) => [newContribution, ...prev]);

            if (newContribution.status === "verified" && isAdmin) {
              setStats((prev) => ({
                total: prev.total + Number(newContribution.amount),
              }));
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedContribution = payload.new as Contribution;
            setContributions((prev) =>
              prev.map((c) =>
                c.id === updatedContribution.id ? updatedContribution : c
              )
            );
            if (isAdmin) {
              if (
                updatedContribution.status === "verified" &&
                payload.old.status !== "verified"
              ) {
                setStats((prev) => ({
                  total: prev.total + Number(updatedContribution.amount),
                }));
              } else if (
                updatedContribution.status !== "verified" &&
                payload.old.status === "verified"
              ) {
                setStats((prev) => ({
                  total: prev.total - Number(updatedContribution.amount),
                }));
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
      .select("*")
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
      setContributions((prev) => [...prev, ...data]);
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
  const progressPercentage = isAdmin
    ? budgetGoal > 0
      ? (displayAmount / budgetGoal) * 100
      : 0
    : assignedAmount > 0
    ? (displayAmount / assignedAmount) * 100
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-white/60">Welcome back, {userName}</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-black/90 border-white/10 text-white backdrop-blur-xl"
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                <Download className="w-4 h-4 mr-2" /> Download Report
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" /> Share Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            className="rounded-full bg-white text-black hover:bg-white/90 font-medium px-6"
          >
            <Link href={`/dashboard/${farewellId}/contributions/payment`}>
              <Plus className="w-4 h-4 mr-2" /> Top Up
            </Link>
          </Button>
        </div>
      </div>

      {/* Dense Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wallet & Key Stats (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <GradientCard
            variant="gold"
            className="relative overflow-hidden h-64 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Wallet className="w-32 h-32" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-black/60 font-medium mb-1">
                  {isAdmin ? "Total Balance" : "My Contribution"}
                </p>
                <h2 className="text-5xl font-bold tracking-tighter">
                  ₹{displayAmount.toLocaleString()}
                </h2>
              </div>
              <div className="bg-black/10 p-2 rounded-full backdrop-blur-sm">
                <CreditCard className="w-6 h-6 text-black/80" />
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="bg-black/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-black/5">
                <p className="text-xs font-semibold text-black/50 uppercase tracking-wider">
                  {isAdmin ? "Goal" : "Assigned"}
                </p>
                <p className="text-lg font-bold text-black">
                  ₹{(isAdmin ? budgetGoal : assignedAmount).toLocaleString()}
                </p>
              </div>
              <div className="bg-black/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-black/5">
                <p className="text-xs font-semibold text-black/50 uppercase tracking-wider">
                  Remaining
                </p>
                <p className="text-lg font-bold text-black">
                  ₹
                  {Math.max(
                    0,
                    (isAdmin ? budgetGoal : assignedAmount) - displayAmount
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </GradientCard>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4 flex flex-col justify-between h-32">
              <div className="p-2 w-fit rounded-lg bg-emerald-500/20 text-emerald-400 mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Progress</p>
                <p className="text-xl font-bold text-white">
                  {progressPercentage.toFixed(1)}%
                </p>
              </div>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col justify-between h-32">
              <div className="p-2 w-fit rounded-lg bg-blue-500/20 text-blue-400 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Contributors</p>
                <p className="text-xl font-bold text-white">
                  {contributions.length}
                </p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Middle Column: Chart & Activity (Col Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="h-64 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> Activity
              </h3>
              <select className="bg-white/5 border border-white/10 rounded-lg text-xs text-white p-1 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="flex-1 w-full min-h-0">
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
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="h-[270px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Recent</h3>
              <Link href="#" className="text-xs text-white/40 hover:text-white">
                View All
              </Link>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {recentTransactions.map((c) => {
                const userName = Array.isArray(c.users)
                  ? c.users[0]?.name
                  : c.users?.name;
                const userAvatar = Array.isArray(c.users)
                  ? c.users[0]?.avatar_url
                  : c.users?.avatar_url;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName || "User"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">
                          {userName ? userName.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-white font-medium">
                          {userName || "Unknown User"}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-white/40 capitalize">
                            {c.method.replace("_", " ")}
                          </p>
                          <span className="text-white/20">•</span>
                          <p className="text-xs text-white/40">
                            {format(new Date(c.created_at), "MMM d")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white">
                      +₹{c.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Quick Actions & More Stats (Col Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard className="h-full flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              {contributions.some((c) => c.status === "verified") ? (
                <Link
                  href={`/dashboard/${farewellId}/contributions/receipt/${
                    contributions.find((c) => c.status === "verified")?.id
                  }`}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 h-10"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Receipt
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="w-full justify-start bg-white/5 border-white/10 text-white/40 h-10"
                >
                  <Download className="w-4 h-4 mr-2" /> Download Receipt
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 h-10"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share Link
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 h-10"
              >
                <Calendar className="w-4 h-4 mr-2" /> Schedule
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-white/40 mb-3">Your Impact</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white">
                  <span>Rank</span>
                  <span className="font-bold">#42</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[65%]" />
                </div>
                <p className="text-xs text-white/40 text-right">Top 15%</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* All Transactions Table (Full Width) */}
      <GlassCard className="min-h-[500px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">All Transactions</h3>
            <p className="text-white/60 text-sm">
              Complete history of all contributions
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full focus-visible:ring-offset-0 focus-visible:ring-white/20"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5 pb-4 mb-2">
            <div className="col-span-6 md:col-span-4">Transaction</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">Date</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">
              Method
            </div>
            <div className="col-span-6 md:col-span-2 text-right">Amount</div>
          </div>

          {filteredContributions.map((c) => {
            const userName = Array.isArray(c.users)
              ? c.users[0]?.name
              : c.users?.name;
            const userAvatar = Array.isArray(c.users)
              ? c.users[0]?.avatar_url
              : c.users?.avatar_url;

            return (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-4 items-center p-4 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="col-span-6 md:col-span-4 flex items-center gap-4">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                      {userName ? userName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {userName || "Unknown User"}
                    </p>
                    <p
                      className={`text-xs capitalize ${
                        c.status === "verified"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {c.status}
                    </p>
                  </div>
                </div>

                <div className="col-span-3 md:col-span-3 hidden md:block text-white/60 text-sm">
                  {format(new Date(c.created_at), "MMM d, yyyy • h:mm a")}
                </div>

                <div className="col-span-3 md:col-span-3 hidden md:block">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 capitalize">
                    {c.method.replace("_", " ")}
                  </span>
                </div>

                <div className="col-span-6 md:col-span-2 text-right">
                  <p className="text-white font-bold text-lg">
                    +₹{c.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Infinite Scroll Loader */}
          <div ref={observerTarget} className="py-4 text-center">
            {isLoadingMore && (
              <p className="text-white/40 text-sm animate-pulse">
                Loading more transactions...
              </p>
            )}
            {!hasMore && contributions.length > 0 && (
              <p className="text-white/20 text-sm">End of list</p>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
