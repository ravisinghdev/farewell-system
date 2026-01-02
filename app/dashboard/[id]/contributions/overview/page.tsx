import { ContributionDashboard } from "@/components/contributions/contribution-dashboard";
import {
  getAllContributionsAction,
  getContributionsAction,
  getFinancialStatsAction,
} from "@/app/actions/contribution-actions";
import {
  getFarewellBudgetDetailsAction,
  getMyAssignedAmountAction,
} from "@/app/actions/budget-actions";
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

  // Fetch data in parallel with conditional logic
  const [contributionsResult, statsResult, budgetResult, myAssignedAmount] =
    await Promise.all([
      isAdmin ? getAllContributionsAction(id) : getContributionsAction(id),
      getFinancialStatsAction(id),
      isAdmin
        ? getFarewellBudgetDetailsAction(id)
        : Promise.resolve({ error: "Skip" }),
      !isAdmin ? getMyAssignedAmountAction(id) : Promise.resolve(0),
    ]);

  const totalAmount = statsResult.collectedAmount || 0;

  const contributions = Array.isArray(contributionsResult)
    ? contributionsResult
    : (contributionsResult as any).contributions || [];

  const stats = {
    total: totalAmount,
    contribution_count: statsResult.totalContributors || 0,
  };

  let budgetGoal = statsResult.targetAmount || 0;
  let members: any[] = [];
  let assignedAmount = 0;

  if (isAdmin && !(budgetResult as any).error) {
    const br = budgetResult as any;
    budgetGoal = br.budgetGoal || budgetGoal;
    members = br.members || [];
    const me = members.find((m: any) => m.userId === user.id);
    assignedAmount = me?.assignedAmount || 0;
  } else if (!isAdmin) {
    assignedAmount = (myAssignedAmount as number) || 0;
  }

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
