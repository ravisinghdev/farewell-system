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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CreditCard,
} from "lucide-react";
import { ContributionHeader } from "@/components/contributions/contribution-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-center h-[50vh] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No analytics data available.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto p-4 md:p-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <ContributionHeader
          title="Financial Overview"
          description="Real-time analytics and contribution insights."
          farewellId={farewellId}
        />
        <div className="flex items-center gap-2 mb-8 md:mb-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 mr-2 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-9 opacity-50 cursor-not-allowed"
          >
            <Calendar className="w-3.5 h-3.5 mr-2" />
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collected
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{data.totalCollected.toLocaleString()}
            </div>
            <div className="flex items-center pt-1">
              <Badge
                variant="secondary"
                className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
              >
                <ArrowUpRight className="mr-1 h-3 w-3" />
                Success Rate Monitored
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCount}</div>
            <p className="text-xs text-muted-foreground pt-1">
              Avg. ₹{data.averageAmount} / transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.timeline.length > 0 ? "Active" : "No Data"}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Last 30 days activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Source</CardTitle>
            <div
              className="radial-progress text-purple-600 dark:text-purple-400 text-[10px]"
              style={{ "--value": 100, "--size": "1.2rem" } as any}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="bg-purple-600 dark:bg-purple-400 h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income Growth</CardTitle>
            <p className="text-sm text-muted-foreground">
              Daily collection trend over the last 30 days
            </p>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.4}
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
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  itemStyle={{ color: "#10b981" }}
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={0}
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
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    Txns
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {data.totalCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6">
              {data.distribution.map((d, i) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground capitalize">
                      {d.name}
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {data.totalCount > 0
                      ? ((d.value / data.totalCount) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent & Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.topContributors.length === 0 && (
                <div className="text-muted-foreground text-sm text-center py-4">
                  No contributors yet.
                </div>
              )}
              {data.topContributors.map((c, i) => (
                <div key={c.email + i} className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                        : i === 1
                        ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                        : i === 2
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.email}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    ₹{c.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.recentActivity.length === 0 && (
                <div className="text-muted-foreground text-sm text-center py-4">
                  No recent activity.
                </div>
              )}
              {data.recentActivity.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        t.status === "verified" || t.status === "approved"
                          ? "bg-emerald-500"
                          : t.status === "rejected"
                          ? "bg-red-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.user_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{format(new Date(t.created_at), "MMM d")}</span>
                        <span>•</span>
                        <span className="capitalize">{t.method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      ₹{t.amount.toLocaleString()}
                    </p>
                    <span
                      className={`text-[10px] uppercase font-bold ${
                        t.status === "verified" || t.status === "approved"
                          ? "text-emerald-600 dark:text-emerald-500"
                          : t.status === "rejected"
                          ? "text-red-600 dark:text-red-500"
                          : "text-amber-600 dark:text-amber-500"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
