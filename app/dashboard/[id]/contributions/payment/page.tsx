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

  // Fetch Public Recent Transactions for Ticker
  const { getPublicRecentTransactionsAction } = await import(
    "@/app/actions/contribution-actions"
  );
  const publicTransactions = await getPublicRecentTransactionsAction(id);

  // Fetch Assigned Amount safely
  const { getMyAssignedAmountAction } = await import(
    "@/app/actions/budget-actions"
  );
  const myAssigned = await getMyAssignedAmountAction(id);

  const remaining = Math.max(0, myAssigned - myTotal);

  return (
    <div className="w-full h-full p-4 md:p-8 animate-in fade-in duration-500">
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
        publicTransactions={publicTransactions}
      />
    </div>
  );
}
