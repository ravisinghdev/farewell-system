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

  // Fetch contributions based on role
  const contributionsResult = isAdmin
    ? await getAllContributionsAction(id)
    : await getContributionsAction(id);

  const contributions = Array.isArray(contributionsResult)
    ? contributionsResult
    : (contributionsResult as any).contributions || [];

  // Fetch stats
  const statsResult = await getFinancialStatsAction(id);
  const stats = { total: statsResult.totalCollected || 0 };

  // Fetch budget details
  const budgetResult = await getFarewellBudgetDetailsAction(id);
  const budgetGoal = budgetResult.budgetGoal || 0;
  const members = budgetResult.members || [];

  // Find current user's assigned amount
  const currentUserMember = members.find((m) => m.userId === user.id);
  const assignedAmount = currentUserMember?.assignedAmount || 0;

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
        userName={user.name}
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
