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
        <GlassCard className="p-8 text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h1>
            <p className="text-white/60 max-w-md mx-auto">
              You do not have permission to view the budget management page.
              This area is restricted to administrators only.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline" className="border-white/10">
              <Link href={`/dashboard/${id}`}>Return to Dashboard</Link>
            </Button>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-white/40 font-mono">
              User ID: {user.id} <br />
              Current Role: {user.role}
            </p>
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Budget Management
        </h1>
        <p className="text-white/60">
          Manage farewell budget, expenses, and track financial health.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/5 border border-white/10 mb-6 h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            <Wallet className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="assignment"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            <Users className="w-4 h-4 mr-2" /> Assignment
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            <Receipt className="w-4 h-4 mr-2" /> Expenses
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            <PieChart className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Budget Goal
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                ₹{budgetGoal.toLocaleString()}
              </p>
              <p className="text-sm text-white/60 mt-2">Total target amount</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Collected</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-400">
                ₹{totalCollected.toLocaleString()}
              </p>
              <p className="text-sm text-white/60 mt-2">
                {progressPercentage.toFixed(1)}% of goal
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Expenses</h3>
              </div>
              <p className="text-3xl font-bold text-red-400">
                ₹{totalExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-white/60 mt-2">Total spent</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Balance</h3>
              </div>
              <p
                className={`text-3xl font-bold ${
                  balance >= 0 ? "text-white" : "text-red-400"
                }`}
              >
                ₹{balance.toLocaleString()}
              </p>
              <p className="text-sm text-white/60 mt-2">Available funds</p>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
            <div className="space-y-4">
              <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Total Assigned</p>
                  <p className="text-white font-bold">
                    ₹{totalAssigned.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">Members</p>
                  <p className="text-white font-bold">{members.length}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent
          value="assignment"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <BudgetManager
            farewellId={id}
            initialBudget={budgetGoal}
            initialMembers={members}
          />
        </TabsContent>

        <TabsContent
          value="expenses"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <ExpenseManager farewellId={id} initialExpenses={expenses} />
        </TabsContent>

        <TabsContent
          value="analytics"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <BudgetCharts
            budgetGoal={budgetGoal}
            totalCollected={totalCollected}
            expenses={expenses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
