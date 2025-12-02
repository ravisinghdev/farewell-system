import { ContributionManager } from "@/components/admin/contribution-manager";
import { Separator } from "@/components/ui/separator";
import { getFinancialStatsAction } from "@/app/actions/contribution-actions";

interface AdminContributionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminContributionsPage({
  params,
}: AdminContributionsPageProps) {
  const { id } = await params;
  const stats = await getFinancialStatsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Contribution Management
          </h2>
          <p className="text-muted-foreground">
            Verify and manage user contributions.
          </p>
        </div>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Verified
          </div>
          <div className="text-2xl font-bold">₹{stats.total_collected}</div>
        </div>
      </div>

      <ContributionManager farewellId={id} />
    </div>
  );
}
