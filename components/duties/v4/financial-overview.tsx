"use client";

import { Duty } from "@/app/actions/duty-actions";
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
      totalBudget += d.expense_limit || 0;
      // Calculate spend from Approved receipts
      const dutySpend = (d.receipts || [])
        .filter((r) => r.status === "approved")
        .reduce((acc, r) => acc + (r.amount || 0), 0);
      totalSpend += dutySpend;
    });

    const percentage = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalSpend;

    return { totalBudget, totalSpend, percentage, remaining };
  }, [duties]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Budget {isAdmin && "(Editable)"}
          </CardTitle>
          <Wallet className="w-4 h-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatMoney(stats.totalBudget)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Allocated across {duties.length} duties
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Actual Spend
          </CardTitle>
          <DollarSign className="w-4 h-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatMoney(stats.totalSpend)}
          </div>
          <Progress value={stats.percentage} className="mt-2 h-1" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(stats.percentage)}% utilized
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Remaining
          </CardTitle>
          <ArrowDown className="w-4 h-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">
            {formatMoney(stats.remaining)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Available Funds</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-none text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Pending Claims
          </CardTitle>
          <ArrowUp className="w-4 h-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {duties.reduce(
              (acc, d) =>
                acc +
                ((d.receipts || []).filter((r) => r.status === "pending")
                  .length || 0),
              0
            )}
          </div>
          <p className="text-xs text-white/60 mt-1">
            Receipts needing approval
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
