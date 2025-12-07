import { getContributionsAction } from "@/app/actions/contribution-actions";
import { getFarewellBudgetDetailsAction } from "@/app/actions/budget-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { DonateForm } from "./donate-form";
import { ContributionHeader } from "@/components/contributions/contribution-header";

export default async function DonatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  // Fetch data for pre-filling
  const contributions = await getContributionsAction(id);
  const myTotal = contributions
    .filter((c) => c.status !== "rejected")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const budgetDetails = await getFarewellBudgetDetailsAction(id);
  const myAssigned =
    budgetDetails.members?.find((m) => m.userId === user?.id)?.assignedAmount ||
    0;

  const remaining = Math.max(0, myAssigned - myTotal);

  const recentTransactions = contributions.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <ContributionHeader
        title="Make a Contribution"
        description="Securely contribute to the farewell fund."
        farewellId={id}
      />
      <DonateForm
        farewellId={id}
        initialAmount={remaining}
        assignedAmount={myAssigned}
        paidAmount={myTotal}
        recentTransactions={recentTransactions}
      />
    </div>
  );
}
