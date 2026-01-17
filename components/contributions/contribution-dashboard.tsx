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
  Activity,
  History,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  getContributionRankAction,
  getMoreContributionsAction,
} from "@/app/actions/contribution-actions";
import { cn } from "@/lib/utils";

interface Contribution {
  id: string;
  amount: number;
  method: "upi" | "cash" | "bank_transfer" | "razorpay";
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
          // Simplified real-time logic for brevity - keeping core functionality
          // In a real refactor, would extract this hook
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const { data: fullContribution } = await supabase
              .from("contributions")
              .select("*, users:user_id(full_name, avatar_url)")
              .eq("id", payload.new.id)
              .single();

            if (fullContribution) {
              setContributions((prev) => {
                // simple dedup
                const exists = prev.find((c) => c.id === fullContribution.id);
                if (exists)
                  return prev.map((c) =>
                    c.id === fullContribution.id ? fullContribution : c
                  );
                return [fullContribution, ...prev];
              });

              // Simple stats update logic
              if (isAdmin && fullContribution.status === "approved") {
                setStats((prev) => ({
                  total:
                    prev.total +
                    (payload.eventType === "INSERT"
                      ? Number(fullContribution.amount)
                      : 0),
                  contribution_count: prev.contribution_count, // Simplified
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
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      const currentLength = contributions.length;
      // Use server action to bypass RLS recursion
      const { data, error } = await getMoreContributionsAction(
        farewellId,
        currentLength,
        10,
        isAdmin ? undefined : userId
      );

      if (error) {
        console.error("Error loading more:", error);
        setHasMore(false);
      } else {
        if (!data || data.length < 10) {
          setHasMore(false);
        }
        if (data && data.length > 0) {
          setContributions((prev) => {
            const uniqueMap = new Map(prev.map((c) => [c.id, c]));
            data.forEach((c: any) => uniqueMap.set(c.id, c));
            return Array.from(uniqueMap.values()).sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
          });
        }
      }
    } catch (err) {
      console.error("Unexpected crash in loadMore:", err);
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [contributions.length, hasMore, farewellId, isAdmin, userId]);

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

  // Stats Logic
  const showAdminStats = isAdmin && budgetGoal > 0;
  const targetAmount = showAdminStats ? budgetGoal : assignedAmount;
  const progressPercentage =
    targetAmount > 0 ? Math.min(100, (displayAmount / targetAmount) * 100) : 0;

  const labelTotal = showAdminStats ? "Total Collected" : "My Contribution";
  const labelTarget = showAdminStats ? "Class Target" : "My Target";

  const handleShare = async () => {
    const text = `I'm Rank #${
      rankData.rank
    } in the farewell contributions! Total: ₹${displayAmount.toLocaleString()}.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Farewell Contribution",
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        // console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      // alert("Copied!");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Overview
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Track and manage your contributions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" /> Share Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/dashboard/${farewellId}/contributions/payment/methods`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Link href={`/dashboard/${farewellId}/contributions/payment`}>
              <Plus className="w-4 h-4 mr-2" />
              New Contribution
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Balance Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {labelTotal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold tracking-tight">
                ₹{displayAmount.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                / ₹{targetAmount.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-zinc-400 dark:text-zinc-500">
                <span>Progress</span>
                <span>{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 dark:bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Mini Chart */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trend
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[120px] p-0 pb-4 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Global Rank */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ranking
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rankData.rank > 0 ? (
              <div className="mt-2 text-center">
                <div className="text-3xl font-bold text-foreground">
                  #{rankData.rank}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Top {rankData.percentile}% contributor
                </p>
                <div className="mt-4 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium text-zinc-600 dark:text-zinc-400 inline-block">
                  {stats.contribution_count || contributions.length} Total
                  Contributors
                </div>
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-xs text-muted-foreground">
                No rank available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            History
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
              {contributions.length}
            </span>
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5 md:col-span-4">User / Status</div>
            <div className="col-span-4 md:col-span-3">Date</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">
              Method
            </div>
            <div className="col-span-3 md:col-span-2 text-right">Amount</div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {filteredContributions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No transactions found.
              </div>
            ) : (
              filteredContributions.map((c) => {
                const isAnonymous = c.metadata?.is_anonymous === true;
                const userData = Array.isArray(c.users) ? c.users[0] : c.users;
                const userName = isAnonymous
                  ? "Anonymous"
                  : userData?.full_name || "Unknown";

                return (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 px-4 py-3 items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
                  >
                    <div className="col-span-5 md:col-span-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground truncate">
                          {userName}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium capitalize mt-0.5 w-fit rounded-full px-1.5 py-0.5",
                            c.status === "verified" || c.status === "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : c.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-3 flex flex-col justify-center">
                      <span className="text-xs text-foreground font-medium">
                        {format(new Date(c.created_at), "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(c.created_at), "h:mm a")}
                      </span>
                    </div>

                    <div className="col-span-3 md:col-span-3 hidden md:block">
                      <span className="text-xs text-muted-foreground capitalize">
                        {c.method ? c.method.replace(/_/g, " ") : "-"}
                      </span>
                    </div>

                    <div className="col-span-3 md:col-span-2 text-right">
                      <span className="font-semibold text-sm text-foreground">
                        +₹{c.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Load More/End Indicator */}
            <div
              ref={observerTarget}
              className="py-4 text-center border-t border-zinc-100 dark:border-zinc-800"
            >
              {isLoadingMore && (
                <div className="flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!hasMore && contributions.length > 0 && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  End of list
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
