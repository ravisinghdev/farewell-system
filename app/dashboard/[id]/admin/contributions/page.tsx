import { ContributionManager } from "@/components/admin/contribution-manager";
import { Separator } from "@/components/ui/separator";
import { getFinancialStatsAction } from "@/app/actions/contribution-actions";
import { RealtimeFinancialStats } from "@/components/admin/realtime-financial-stats";

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

      <RealtimeFinancialStats initialStats={stats} farewellId={id} />

      <ContributionManager farewellId={id} />
    </div>
  );
}
