"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle } from "lucide-react";
import { useFinance } from "@/components/admin/finance/finance-context";

// Props no longer needed as we use context, but keeping interface empty if needed for future
interface FinanceStatsProps {
  farewellId: string;
}

export function FinanceStats({ farewellId }: FinanceStatsProps) {
  const { stats } = useFinance();

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatter.format(stats.netBalance)}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Available for withdrawal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatter.format(stats.totalCollected)}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Lifetime gross volume
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatter.format(stats.totalSpent)}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Operational costs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatter.format(stats.pendingAmount)}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Needs verification
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
