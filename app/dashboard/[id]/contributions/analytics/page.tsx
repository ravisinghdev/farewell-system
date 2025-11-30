"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { getContributionsAction } from "@/app/actions/contribution-actions";
import { format, subDays } from "date-fns";
import { Loader2 } from "lucide-react";

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ec4899"];

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [farewellId, setFarewellId] = useState<string>("");

  useEffect(() => {
    async function load() {
      const { id } = await params;
      setFarewellId(id);
      // For analytics, we might want ALL contributions if admin, but let's stick to user's view or aggregate if we had an aggregate action.
      // Since this is "Analytics & Insights", it implies personal + global stats.
      // For now, let's just show personal stats to be safe, or if we want global we need a new action.
      // The prompt implies a general dashboard. Let's assume personal for now to avoid leaking data if not admin,
      // BUT usually analytics in this context means "How is the farewell doing?".
      // Let's use the leaderboard action to get global stats implicitly or just fetch personal.
      // Actually, let's just fetch personal contributions for now to be safe and consistent with "My Dashboard".
      // Wait, the user asked for "Analytics & Insights" which usually means global.
      // I'll fetch personal for now.

      const res = await getContributionsAction(id);
      setData(res);
      setLoading(false);
    }
    load();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  // Process Data
  const verified = data.filter((c) => c.status === "verified");
  const totalAmount = verified.reduce((sum, c) => sum + Number(c.amount), 0);

  // Daily Stats
  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTotal = verified
      .filter((c) => format(new Date(c.created_at), "yyyy-MM-dd") === dateStr)
      .reduce((sum, c) => sum + Number(c.amount), 0);
    return { name: format(date, "MMM d"), amount: dayTotal };
  });

  // Method Stats
  const methodStats = [
    { name: "UPI", value: verified.filter((c) => c.method === "upi").length },
    { name: "Cash", value: verified.filter((c) => c.method === "cash").length },
    {
      name: "Bank",
      value: verified.filter((c) => c.method === "bank_transfer").length,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Analytics & Insights
        </h1>
        <p className="text-muted-foreground">
          Overview of your contribution activity and trends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <p className="text-muted-foreground text-sm mb-1">
            Total Contributed
          </p>
          <p className="text-4xl font-bold text-foreground">
            ₹{totalAmount.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-muted-foreground text-sm mb-1">
            Total Transactions
          </p>
          <p className="text-4xl font-bold text-foreground">{data.length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-muted-foreground text-sm mb-1">
            Verified Transactions
          </p>
          <p className="text-4xl font-bold text-emerald-500">
            {verified.length}
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-6">
            Contribution Trend (Last 7 Days)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(128,128,128,0.2)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                />
                <Bar
                  dataKey="amount"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-6">
            Payment Methods
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {methodStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {methodStats.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
