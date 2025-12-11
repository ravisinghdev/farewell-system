import { ContributionDashboard } from "@/components/contributions/contribution-dashboard";
import {
  getAllContributionsAction,
  getContributionsAction,
  getFinancialStatsAction,
} from "@/app/actions/contribution-actions";
import { getFarewellBudgetDetailsAction } from "@/app/actions/budget-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { BudgetManager } from "@/components/admin/budget-manager";
import { checkIsAdmin } from "@/lib/auth/roles";
import { ContributionHeader } from "@/components/contributions/contribution-header";

export default async function ContributionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const isAdmin = checkIsAdmin(user.role);

  // Fetch data in parallel
  const [contributionsResult, statsResult, budgetResult] = await Promise.all([
    isAdmin ? getAllContributionsAction(id) : getContributionsAction(id),
    getFinancialStatsAction(id),
    getFarewellBudgetDetailsAction(id),
  ]);

  const totalAmount = statsResult.collectedAmount || 0;

  const contributions = Array.isArray(contributionsResult)
    ? contributionsResult
    : (contributionsResult as any).contributions || [];

  const stats = {
    total: totalAmount,
    contribution_count: statsResult.totalContributors || 0,
  };
  // console.log("Stats: ", stats);
  const budgetGoal = budgetResult.budgetGoal || 0;
  const members = budgetResult.members || [];

  // Find current user's assigned amount
  const currentUserMember = members.find((m) => m.userId === user.id);
  const assignedAmount = currentUserMember?.assignedAmount || 0;

  // Debug Logs
  // console.log("--- Dashboard Overview Debug ---");
  // console.log("User ID:", user.id);
  // console.log("Is Admin:", isAdmin);
  // console.log("Budget Goal (Raw):", budgetGoal);
  // console.log("Member Found:", currentUserMember);
  // console.log("Assigned Amount (Calculated):", assignedAmount);
  // console.log("Stats: ", stats); // Already logged

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <ContributionHeader
        title="Financial Overview"
        description="Track your contributions and the class goal."
        farewellId={id}
      />

      <ContributionDashboard
        initialContributions={contributions}
        initialStats={stats}
        farewellId={id}
        userId={user.id}
        isAdmin={isAdmin}
        userName={user.name || "User"}
        assignedAmount={assignedAmount}
        budgetGoal={budgetGoal}
      />

      {isAdmin && (
        <div className="pb-12">
          <BudgetManager
            farewellId={id}
            initialBudget={budgetGoal}
            initialMembers={members}
          />
        </div>
      )}
    </div>
  );
}
