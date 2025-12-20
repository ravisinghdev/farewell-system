"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { type Expense } from "@/app/actions/expense-actions";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface BudgetChartsProps {
  budgetGoal: number;
  totalCollected: number;
  expenses: Expense[];
}

const COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

export function BudgetCharts({
  budgetGoal,
  totalCollected,
  expenses,
}: BudgetChartsProps) {
  // Prepare data for Expenses by Category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || "Other";
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(expensesByCategory).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  // Prepare data for Budget vs Actual
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budgetVsActualData = [
    {
      name: "Goal",
      amount: budgetGoal,
      fill: "url(#colorGoal)",
    },
    {
      name: "Collected",
      amount: totalCollected,
      fill: "url(#colorCollected)",
    },
    {
      name: "Spent",
      amount: totalExpenses,
      fill: "url(#colorSpent)",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard className="p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />

        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-500 rounded-full" />
          Expense Distribution
        </h3>

        <div className="h-[300px] w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="filter drop-shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--popover-foreground))",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  formatter={(value: any) => [
                    `₹${value.toLocaleString()}`,
                    "Amount",
                  ]}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              </div>
              <p>No expenses recorded yet</p>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500" />

        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full" />
          Financial Health
        </h3>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetVsActualData} barSize={60}>
              <defs>
                <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.1)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  color: "hsl(var(--popover-foreground))",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
                formatter={(value: any) => [
                  `₹${value.toLocaleString()}`,
                  "Amount",
                ]}
              />
              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
                animationDuration={1500}
              >
                {budgetVsActualData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
