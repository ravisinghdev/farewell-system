import {
  getAllContributionsAction,
  getContributionsAction,
} from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { ContributionHistoryList } from "@/components/contributions/contribution-history-list";
import { checkIsAdmin } from "@/lib/auth/roles";
import { GlassCard } from "@/components/ui/glass-card";
import { TransactionTable } from "@/components/admin/transaction-table";
import { ContributionHeader } from "@/components/contributions/contribution-header";
import { Wallet, Clock } from "lucide-react";
import { format } from "date-fns";

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
  const transactions = isAdmin
    ? await getAllContributionsAction(id)
    : await getContributionsAction(id);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <ContributionHeader
        title={isAdmin ? "All Transactions" : "My Payment History"}
        description={
          isAdmin
            ? "View and manage all transactions."
            : "Track your contributions and download receipts."
        }
        farewellId={id}
      />

      {isAdmin ? (
        <GlassCard className="p-6">
          <TransactionTable
            data={transactions as any}
            farewellId={id}
            isAdmin={isAdmin}
          />
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Total Summary for User */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-6 flex items-center justify-between bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-200/60 uppercase tracking-wider">
                  Total Contributed
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹
                  {transactions
                    .reduce((acc, curr) => acc + Number(curr.amount), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
            </GlassCard>

            <GlassCard className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/40 uppercase tracking-wider">
                  Latest Contribution
                </p>
                <p className="text-xl font-bold text-white">
                  {transactions.length > 0
                    ? format(
                        new Date(transactions[0].created_at),
                        "MMM d, yyyy"
                      )
                    : "N/A"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Clock className="w-6 h-6 text-white/60" />
              </div>
            </GlassCard>
          </div>

          <h3 className="text-lg font-bold text-white px-1">Recent Activity</h3>
          <ContributionHistoryList
            transactions={transactions as any}
            farewellId={id}
          />
        </div>
      )}
    </div>
  );
}
