"use client";

import { Duty } from "@/types/duties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, DollarSign, Wallet } from "lucide-react";
import { useMemo } from "react";

// Inline helper if missing
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

export function FinancialOverview({
  duties,
  isAdmin,
}: {
  duties: Duty[];
  isAdmin?: boolean;
}) {
  const stats = useMemo(() => {
    let totalBudget = 0;
    let totalSpend = 0;

    duties.forEach((d) => {
      totalBudget += d.expected_amount || 0;
      // Calculate spend from Approved receipts
      const dutySpend = (d.receipts || [])
        .filter((r) => r.status === "approved")
        .reduce((acc, r) => acc + (r.amount_paid || 0), 0);
      totalSpend += dutySpend;
    });

    const percentage = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalSpend;

    return { totalBudget, totalSpend, percentage, remaining };
  }, [duties]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Budget
          </CardTitle>
          <Wallet className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatMoney(stats.totalBudget)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Allocated across {duties.length} duties
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Actual Spend
          </CardTitle>
          <DollarSign className="w-4 h-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatMoney(stats.totalSpend)}
          </div>
          <Progress value={stats.percentage} className="mt-2 h-1" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(stats.percentage)}% utilized
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Remaining
          </CardTitle>
          <ArrowDown className="w-4 h-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatMoney(stats.remaining)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Available Funds</p>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Pending Claims
          </CardTitle>
          <ArrowUp className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {duties.reduce(
              (acc, d) =>
                acc +
                ((d.receipts || []).filter((r) => r.status === "pending_vote")
                  .length || 0),
              0
            )}
          </div>
          <p className="text-xs text-primary/70 mt-1">
            Receipts needing vote/approval
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
