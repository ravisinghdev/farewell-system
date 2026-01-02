import {
  getUserContributionsPaginatedAction,
  getUserStatsAction,
} from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { ContributionHistoryList } from "@/components/contributions/contribution-history-list";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Card, CardContent } from "@/components/ui/card";
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

  let initialTransactions: any[] = [];
  let userStats = { totalContribution: 0 };
  let initialTotal = 0;

  if (!isAdmin) {
    // User: Fetch first page + Stats
    const [txRes, statsRes] = await Promise.all([
      getUserContributionsPaginatedAction(id, 1, 10),
      getUserStatsAction(id),
    ]);
    initialTransactions = txRes.data;
    initialTotal = txRes.total;
    userStats = statsRes;
  }
  // Admin: TransactionTable handles fetching

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-10">
      <ContributionHeader
        title={isAdmin ? "All Transactions" : "My Payment History"}
        description={
          isAdmin
            ? "View and manage all transactions."
            : "Track your contributions and download receipts."
        }
        farewellId={id}
        minimal={isAdmin}
      />

      {isAdmin ? (
        <Card>
          <CardContent className="p-0">
            <TransactionTable farewellId={id} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Total Summary for User */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Total Contributed
                  </p>
                  <p className="text-3xl font-bold">
                    ₹{userStats.totalContribution.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-500 dark:text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Latest Contribution
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {initialTransactions.length > 0
                      ? format(
                          new Date(initialTransactions[0].created_at),
                          "MMM d, yyyy"
                        )
                      : "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 px-1">
              Recent Activity
            </h3>
            <ContributionHistoryList
              initialTransactions={initialTransactions}
              farewellId={id}
              initialTotal={initialTotal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
