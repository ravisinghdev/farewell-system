import {
  getAllContributionsAction,
  getContributionsAction,
} from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { TransactionTable } from "@/components/admin/transaction-table";
import { GlassCard } from "@/components/ui/glass-card";
import { checkIsAdmin } from "@/lib/auth/roles";

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isAdmin ? "All Transactions" : "My Payment History"}
        </h1>
        <p className="text-white/60">
          {isAdmin
            ? "View and manage all transactions from all users."
            : "View your complete contribution history and download receipts."}
        </p>
      </div>

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
