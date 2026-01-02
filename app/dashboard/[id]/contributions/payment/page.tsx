import { Suspense } from "react";
import { getContributionsAction } from "@/app/actions/contribution-actions";
import { getFarewellBudgetDetailsAction } from "@/app/actions/budget-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { DonateForm } from "./donate-form";
import { ContributionHeader } from "@/components/contributions/contribution-header";
import { RecentActivitySidebar } from "./recent-activity-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DonatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel Fetching for critical data
  // Removed publicTransactions from here to let it stream in via Suspense
  const [contributions, settings, myAssigned] = await Promise.all([
    getContributionsAction(id),
    import("@/app/actions/contribution-actions").then((mod) =>
      mod.getPublicFarewellSettingsAction(id)
    ),
    import("@/app/actions/budget-actions").then((mod) =>
      mod.getMyAssignedAmountAction(id)
    ),
  ]);

  // Calculate verified and pending totals separately
  const verifiedTotal = contributions
    .filter((c: any) => c.status === "verified")
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  const pendingTotal = contributions
    .filter((c: any) => c.status === "pending")
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  const myTotal = verifiedTotal + pendingTotal;
  const remaining = Math.max(0, myAssigned - myTotal);

  return (
    <div className="w-full h-full p-4 md:p-8 animate-in fade-in duration-500">
      {/* ContributionHeader removed to unify navigation */}
      <DonateForm
        farewellId={id}
        initialAmount={remaining}
        assignedAmount={myAssigned}
        paidAmount={myTotal}
        verifiedAmount={verifiedTotal}
        pendingAmount={pendingTotal}
        initialSettings={settings}
        sidebar={
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivitySidebar farewellId={id} />
          </Suspense>
        }
      />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
          <Skeleton className="w-12 h-4" />
        </div>
      ))}
    </div>
  );
}
