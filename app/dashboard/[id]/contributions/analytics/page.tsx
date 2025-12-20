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
import { getAnalyticsDataAction } from "@/app/actions/contribution-actions";
import { format } from "date-fns";
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

interface AnalyticsPayload {
  timeline: { date: string; amount: number }[];
  distribution: { name: string; value: number }[];
  averageAmount: number;
  totalCount: number;
  totalCollected: number;
  topContributors: {
    name: string;
    email: string;
    avatar: string | null;
    amount: number;
  }[];
  recentActivity: {
    id: string;
    amount: number;
    method: string;
    status: string;
    created_at: string;
    user_name: string;
  }[];
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [farewellId, setFarewellId] = useState<string>("");
  const [daysRange, setDaysRange] = useState(30); // Controlled by RPC anyway
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchData(id: string) {
    try {
      // Fetch server-aggregated data
      const res = await getAnalyticsDataAction(id);
      setData(res);
    } catch (e) {
      console.error("Failed to fetch analytics data", e);
      toast.error("Failed to load analytics");
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

  if (!data) {
    return (
      <div className="text-center p-8 text-white/50">
        No analytics data available.
      </div>
    );
  }

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

          <Button
            variant="outline"
            disabled
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 opacity-70 cursor-not-allowed"
          >
            <Calendar className="w-4 h-4 mr-2 text-white/60" />
            Last 30 Days (Fixed)
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-emerald-600 dark:text-emerald-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Total Collected
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            ₹{data.totalCollected.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600/60 dark:text-emerald-400/60 bg-emerald-500/10 w-fit px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            <span>Success Rate monitored</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-blue-600 dark:text-blue-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Total Transactions
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            {data.totalCount}
          </p>
          <div className="mt-4 text-xs text-blue-600/60 dark:text-blue-400/60 flex items-center gap-1">
            <span>Avg. ₹{data.averageAmount} / transaction</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-amber-600 dark:text-amber-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Daily Trend
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            {data.timeline.length > 0 ? "Active" : "No Data"}
          </p>
          <div className="mt-4 text-xs text-amber-600/60 dark:text-amber-400/60 flex items-center gap-1">
            <span>Last 30 days activity</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <div
              className="radial-progress text-purple-500 dark:text-purple-400"
              style={{ "--value": 100 } as any}
            />
          </div>
          <p className="text-purple-600 dark:text-purple-400/80 text-sm font-medium uppercase tracking-wider mb-1">
            Data Source
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-foreground tracking-tight">
              Server Aggregated
            </p>
          </div>
          <div className="mt-4 w-full bg-primary/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full w-full" />
          </div>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <GlassCard className="p-6 lg:col-span-2 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Income Growth
              </h3>
              <p className="text-sm text-muted-foreground">
                Daily collection trend over the last 30 days
              </p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border) / 0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  itemStyle={{ color: "#10b981" }}
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  activeDot={{
                    r: 6,
                    fill: "hsl(var(--background))",
                    stroke: "#10b981",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Breakdown */}
        <div className="flex flex-col gap-6 h-[450px]">
          <GlassCard className="p-6 flex-1 flex flex-col min-h-0">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Payment Methods
            </h3>
            <div className="flex-1 w-full min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="hsla(var(--background), 0.2)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase">
                    Txns
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {data.totalCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {data.distribution.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span>{d.name}</span>
                  <span className="font-mono ml-auto opacity-70">
                    {data.totalCount > 0
                      ? ((d.value / data.totalCount) * 100).toFixed(0)
                      : 0}
                    %
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
          <h3 className="text-lg font-bold text-foreground mb-6">
            Top Contributors
          </h3>
          <div className="space-y-4">
            {data.topContributors.length === 0 && (
              <div className="text-muted-foreground text-sm">
                No contributors yet.
              </div>
            )}
            {data.topContributors.map((c, i) => (
              <div key={c.email + i} className="flex items-center gap-4 group">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    i === 0
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500"
                      : i === 1
                      ? "bg-gray-400/20 text-gray-600 dark:text-gray-400"
                      : i === 2
                      ? "bg-orange-500/20 text-orange-600 dark:text-orange-500"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden border border-border/50">
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-emerald-500 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.email}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{c.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent Transactions Feed */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">
            Recent Activity
          </h3>
          <div className="space-y-0 relative border-l border-border/10 ml-3">
            {data.recentActivity.length === 0 && (
              <div className="text-muted-foreground text-sm pl-8">
                No recent activity.
              </div>
            )}
            {data.recentActivity.map((t, i) => (
              <div key={t.id} className="relative pl-8 pb-6 last:pb-0">
                <div
                  className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-card ${
                    t.status === "verified" || t.status === "approved"
                      ? "bg-emerald-500"
                      : t.status === "rejected"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {format(new Date(t.created_at), "MMM d, h:mm a")} •{" "}
                      <span className="capitalize">{t.method}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      ₹{t.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant="outline"
                      className={`h-5 text-[10px] px-1.5 ${
                        t.status === "verified" || t.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : t.status === "rejected"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
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
