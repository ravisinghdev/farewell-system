"use client";

import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Net Balance
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatter.format(stats.netBalance)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Collected
              </p>
              <h3 className="text-2xl font-bold">
                {formatter.format(stats.totalCollected)}
              </h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </p>
              <h3 className="text-2xl font-bold text-destructive">
                {formatter.format(stats.totalSpent)}
              </h3>
            </div>
            <div className="p-3 bg-destructive/10 rounded-full text-destructive">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-500/10 border-yellow-500/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Action
              </p>
              <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatter.format(stats.pendingAmount)}
              </h3>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
