import {
  getAllContributionsAction,
  getContributionsAction,
} from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { TransactionTable } from "@/components/admin/transaction-table";
import { GlassCard } from "@/components/ui/glass-card";
import { checkIsAdmin } from "@/lib/auth/roles";
import { ContributionHeader } from "@/components/contributions/contribution-header";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const isAdmin = checkIsAdmin(user.role);

  // Fetch data based on role
  // Admins see ALL transactions
  // Regular users see ONLY their own
  const transactions = isAdmin
    ? await getAllContributionsAction(id)
    : await getContributionsAction(id);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <ContributionHeader
        title={isAdmin ? "All Transactions" : "My Payment History"}
        description={
          isAdmin
            ? "View and manage all transactions."
            : "View your complete contribution history."
        }
        farewellId={id}
      />

      <GlassCard className="p-6">
        <TransactionTable
          data={transactions as any}
          farewellId={id}
          isAdmin={isAdmin}
        />
      </GlassCard>
    </div>
  );
}
