"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueStatsAction } from "@/app/actions/analytics-actions";

export function RevenueChart({ farewellId }: { farewellId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getRevenueStatsAction(farewellId);
      if (result.success && result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    load();
  }, [farewellId]);

  if (loading)
    return (
      <div className="h-[350px] flex items-center justify-center">
        Loading stats...
      </div>
    );

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Revenue Overview (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: any) => [`₹${value}`, "Revenue"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
