import { getFarewellBudgetDetailsAction } from "@/app/actions/budget-actions";
import { getFinancialStatsAction } from "@/app/actions/contribution-actions";
import { getExpensesAction } from "@/app/actions/expense-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { BudgetManager } from "@/components/admin/budget-manager";
import { ExpenseManager } from "@/components/admin/expense-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Wallet,
  Users,
  TrendingUp,
  Receipt,
  PieChart,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { BudgetCharts } from "@/components/admin/budget-charts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { checkIsAdmin } from "@/lib/auth/roles";

import { ContributionHeader } from "@/components/contributions/contribution-header";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) {
    redirect("/auth");
  }

  const isAdmin = checkIsAdmin(user.role);

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-700">
        <GlassCard className="p-12 text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Restricted Access
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">
              This area is restricted to administrators only.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-white/10 h-12 px-8 rounded-xl"
            >
              <Link href={`/dashboard/${id}/contributions`}>
                Return to Overview
              </Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Fetch data
  const [budgetResult, statsResult, expensesResult] = await Promise.all([
    getFarewellBudgetDetailsAction(id),
    getFinancialStatsAction(id),
    getExpensesAction(id),
  ]);

  const budgetGoal = budgetResult.budgetGoal || 0;
  const members = budgetResult.members || [];
  const totalCollected = statsResult.total_collected || 0;
  const expenses = expensesResult.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const totalAssigned = members.reduce((sum, m) => sum + m.assignedAmount, 0);
  const remaining = budgetGoal - totalCollected;
  const progressPercentage =
    budgetGoal > 0 ? (totalCollected / budgetGoal) * 100 : 0;

  const balance = totalCollected - totalExpenses;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      {/* Header with quick stats ticker potentially, but we stick to clean header */}
      <ContributionHeader
        title="Finance Command Center"
        description="Real-time budget tracking and expense management."
        farewellId={id}
      />

      {/* HERO BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Balance Card (Large) */}
        <GlassCard className="col-span-1 md:col-span-6 lg:col-span-4 p-8 relative overflow-hidden flex flex-col justify-between min-h-[200px] group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium uppercase tracking-wider text-emerald-400">
                Available Balance
              </span>
            </div>
            <h2 className="text-5xl font-bold text-white tracking-tight mt-4">
              ₹{balance.toLocaleString()}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <span>Target: ₹{budgetGoal.toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{progressPercentage.toFixed(1)}% Funded</span>
            </div>
          </div>

          {/* Progress Bar inside card */}
          <div className="w-full h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
        </GlassCard>

        {/* Quick Stats Grid */}
        <div className="col-span-1 md:col-span-6 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <GlassCard className="p-6 flex flex-col justify-center gap-2 group hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">Collected</span>
            <span className="text-2xl font-bold text-blue-400">
              ₹{totalCollected.toLocaleString()}
            </span>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col justify-center gap-2 group hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">
              Total Expenses
            </span>
            <span className="text-2xl font-bold text-red-400">
              ₹{totalExpenses.toLocaleString()}
            </span>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col justify-center gap-2 group hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">
              Remaining Goal
            </span>
            <span className="text-2xl font-bold text-amber-400">
              ₹{remaining > 0 ? remaining.toLocaleString() : 0}
            </span>
          </GlassCard>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="animate-in slide-in-from-bottom-8 duration-700 delay-100">
        <BudgetCharts
          budgetGoal={budgetGoal}
          totalCollected={totalCollected}
          expenses={expenses}
        />
      </div>

      {/* MANAGEMENT SECTION - SPLIT VIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">
        {/* Budget/Income Manager */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <h3 className="text-xl font-bold text-white">Income Management</h3>
          </div>
          <BudgetManager
            farewellId={id}
            initialBudget={budgetGoal}
            initialMembers={members}
          />
        </div>

        {/* Expense Manager */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-red-500 rounded-full" />
            <h3 className="text-xl font-bold text-white">Expense Tracking</h3>
          </div>
          <ExpenseManager farewellId={id} initialExpenses={expenses} />
        </div>
      </div>
    </div>
  );
}
