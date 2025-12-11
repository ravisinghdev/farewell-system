"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { getAllContributionsAction } from "@/app/actions/contribution-actions";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import {
  ArrowUpRight,
  Loader2,
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  RefreshCcw,
  ChevronDown,
} from "lucide-react";
import { ContributionHeader } from "@/components/contributions/contribution-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

interface AnalyticsData {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  method: string;
  users?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [farewellId, setFarewellId] = useState<string>("");
  const [daysRange, setDaysRange] = useState(14);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchData(id: string) {
    try {
      const res = await getAllContributionsAction(id);
      setData(res as any);
    } catch (e) {
      console.error("Failed to fetch analytics data", e);
    }
  }

  useEffect(() => {
    async function load() {
      const { id } = await params;
      setFarewellId(id);
      await fetchData(id);
      setLoading(false);
    }
    load();
  }, [params]);

  // Real-time subscription
  useEffect(() => {
    if (!farewellId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("analytics-dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          fetchData(farewellId);
          toast.info("Dashboard updated with real-time data");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(farewellId);
    setTimeout(() => setIsRefreshing(false), 800);
    toast.success("Analytics refreshed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // --- Processing Data ---

  // Filter Verified/Approved
  const verified = data.filter(
    (c) => c.status === "verified" || c.status === "approved"
  );

  // KPIs
  const totalAmount = verified.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalTransactions = verified.length;
  const avgContribution =
    totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  // Pending
  const pendingCount = data.filter((c) => c.status === "pending").length;
  const pendingAmount = data
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Daily Trend (Area Chart)
  const daysToShow = daysRange;
  const trendData = Array.from({ length: daysToShow }).map((_, i) => {
    const date = subDays(new Date(), daysToShow - 1 - i);
    const dayStart = startOfDay(date);

    // Aggregate volume
    const dailyVolume = verified
      .filter((c) => isSameDay(new Date(c.created_at), date))
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      date: format(date, "MMM d"),
      amount: dailyVolume,
      fullDate: date, // for sorting if needed
    };
  });

  // Method Distribution (Pie Chart)
  const methodCounts: Record<string, number> = {};
  verified.forEach((c) => {
    const method =
      c.method === "bank_transfer"
        ? "Bank"
        : c.method.replace("_", " ").toUpperCase();
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });
  const methodData = Object.entries(methodCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Top Contributors (Leaderboard)
  // Aggregate by user email/id
  const contributorMap: Record<
    string,
    { name: string; amount: number; avatar: string | null; email: string }
  > = {};
  verified.forEach((c) => {
    const email = c.users?.email || "unknown";
    if (!contributorMap[email]) {
      contributorMap[email] = {
        name: c.users?.full_name || "Anonymous",
        amount: 0,
        avatar: c.users?.avatar_url || null,
        email,
      };
    }
    contributorMap[email].amount += Number(c.amount);
  });
  const topContributors = Object.values(contributorMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Recent Activity
  const recentActivity = [...data]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto p-4 md:p-8">
      <div>
        <ContributionHeader
          title="Financial Overview"
          description="Real-time analytics and contribution insights."
          farewellId={farewellId}
        />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Live Updates Active
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Calendar className="w-4 h-4 mr-2 text-white/60" />
                Last {daysRange} Days
                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem onClick={() => setDaysRange(7)}>
                Last 7 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDaysRange(14)}>
                Last 14 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDaysRange(30)}>
                Last 30 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDaysRange(90)}>
                Last 3 Months
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-emerald-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Total Collected
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            ₹{totalAmount.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/60 bg-emerald-500/5 w-fit px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12% from last week</span> {/** Mock trend for now */}
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-400" />
          </div>
          <p className="text-blue-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Contributors
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {Object.keys(contributorMap).length}
          </p>
          <div className="mt-4 text-xs text-blue-400/60 flex items-center gap-1">
            <span>Avg. ₹{avgContribution.toFixed(0)} / person</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-amber-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Pending Clearance
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            ₹{pendingAmount.toLocaleString()}
          </p>
          <div className="mt-4 text-xs text-amber-400/60 flex items-center gap-1">
            <span>{pendingCount} transactions pending</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group">
          {/* Success Rate */}
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <div
              className="radial-progress text-purple-400"
              style={{ "--value": 70 } as any}
            />
          </div>
          <p className="text-purple-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Success Rate
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {data.length > 0
                ? ((verified.length / data.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="mt-4 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full"
              style={{
                width: `${
                  data.length > 0 ? (verified.length / data.length) * 100 : 0
                }%`,
              }}
            />
          </div>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <GlassCard className="p-6 lg:col-span-2 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Income Growth</h3>
              <p className="text-sm text-white/40">
                Daily collection trend over the last 14 days
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              <TrendingUp className="w-3 h-3 mr-1" /> Trending Up
            </Badge>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#10b981" }}
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Breakdown & Top Contributors */}
        <div className="flex flex-col gap-6 h-[450px]">
          <GlassCard className="p-6 flex-1 flex flex-col min-h-0">
            <h3 className="text-lg font-bold text-white mb-4">
              Payment Methods
            </h3>
            <div className="flex-1 w-full min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {methodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(0,0,0,0.2)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0a",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Total Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-white/40 font-bold uppercase">
                    Transactions
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {verified.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {methodData.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-xs text-white/60"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span>{d.name}</span>
                  <span className="font-mono ml-auto opacity-50">
                    {((d.value / verified.length) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent & Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Contributors */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">
            Top Contributors
          </h3>
          <div className="space-y-4">
            {topContributors.map((c, i) => (
              <div key={c.email} className="flex items-center gap-4 group">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    i === 0
                      ? "bg-yellow-500/20 text-yellow-500"
                      : i === 1
                      ? "bg-gray-400/20 text-gray-400"
                      : i === 2
                      ? "bg-orange-500/20 text-orange-500"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-white/40 truncate">{c.email}</p>
                </div>
                <p className="text-sm font-bold text-emerald-400">
                  ₹{c.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent Transactions Feed */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-0 relative border-l border-white/10 ml-3">
            {recentActivity.map((t, i) => (
              <div key={t.id} className="relative pl-8 pb-6 last:pb-0">
                <div
                  className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-[#0a0a0a] ${
                    t.status === "verified" || t.status === "approved"
                      ? "bg-emerald-500"
                      : t.status === "rejected"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {t.users?.full_name || "Anonymous User"}
                    </p>
                    <p className="text-xs text-white/40 flex items-center gap-2">
                      {format(new Date(t.created_at), "MMM d, h:mm a")} •{" "}
                      <span className="capitalize">{t.method}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      ₹{t.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant="outline"
                      className={`h-5 text-[10px] px-1.5 ${
                        t.status === "verified" || t.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : t.status === "rejected"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
