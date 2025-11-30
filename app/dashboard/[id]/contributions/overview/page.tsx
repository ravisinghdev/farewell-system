import { ContributionDashboard } from "@/components/contributions/contribution-dashboard";
import {
  getAllContributionsAction,
  getContributionsAction,
  getContributionStatsAction,
} from "@/app/actions/contribution-actions";
import { getFarewellBudgetDetailsAction } from "@/app/actions/budget-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { BudgetManager } from "@/components/admin/budget-manager";

export default async function ContributionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const isAdmin = user.role === "main_admin" || user.role === "parallel_admin";

  // Fetch contributions based on role
  const contributionsResult = isAdmin
    ? await getAllContributionsAction(id)
    : await getContributionsAction(id);

  const contributions = Array.isArray(contributionsResult)
    ? contributionsResult
    : (contributionsResult as any).contributions || [];

  // Fetch stats
  const statsResult = await getContributionStatsAction(id);
  const stats = { total: statsResult.total || 0 };

  // Fetch budget details
  const budgetResult = await getFarewellBudgetDetailsAction(id);
  const budgetGoal = budgetResult.budgetGoal || 0;
  const members = budgetResult.members || [];

  // Find current user's assigned amount
  const currentUserMember = members.find((m) => m.userId === user.id);
  const assignedAmount = currentUserMember?.assignedAmount || 0;

  return (
    <div className="space-y-12">
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
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
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
