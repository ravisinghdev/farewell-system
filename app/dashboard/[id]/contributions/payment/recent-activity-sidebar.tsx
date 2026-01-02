import { getPublicRecentTransactionsAction } from "@/app/actions/contribution-actions";

export async function RecentActivitySidebar({
  farewellId,
}: {
  farewellId: string;
}) {
  const publicTransactions = await getPublicRecentTransactionsAction(
    farewellId
  );
  if (!Array.isArray(publicTransactions)) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No recent activity.
      </div>
    );
  }

  return (
    <>
      {publicTransactions.map((tx: any, i: number) => (
        <div
          key={i}
          className="p-3 rounded-lg border bg-card flex justify-between items-center text-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
              {tx.users?.full_name?.[0] || "?"}
            </div>
            <div>
              <p className="font-medium">
                {tx.users?.full_name || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(tx.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className="font-bold text-emerald-600">+₹{tx.amount}</span>
        </div>
      ))}
    </>
  );
}
