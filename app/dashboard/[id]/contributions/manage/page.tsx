import { ContributionHeader } from "@/components/contributions/contribution-header";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { checkIsAdmin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  getFinancialStatsAction,
  getFarewellSettingsAction,
} from "@/app/actions/contribution-actions";
import { ContributionControlCenter } from "@/components/admin/contribution-control-center";

interface ManageContributionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ManageContributionsPage({
  params,
}: ManageContributionsPageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  if (!checkIsAdmin(user.role)) {
    return (
      <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-700">
        <GlassCard className="p-12 text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Restricted Access
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">
              This area is reserved for administrators managing the farewell
              finances.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-input hover:border-accent h-12 px-8 rounded-xl"
            >
              <Link href={`/dashboard/${id}/contributions`}>
                Return to Overview
              </Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const stats = await getFinancialStatsAction(id);
  const settings = await getFarewellSettingsAction(id);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <ContributionHeader
        title="Contribution Command Center"
        description="Advanced controls for financial management and auditing."
        farewellId={id}
        minimal={true}
      />

      <ContributionControlCenter
        farewellId={id}
        initialStats={stats}
        initialSettings={settings}
      />
    </div>
  );
}
