import { getLeaderboardAction } from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { LeaderboardList } from "@/components/contributions/leaderboard-list";
import { ContributionHeader } from "@/components/contributions/contribution-header";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const leaderboardData = await getLeaderboardAction(id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto p-4 md:p-8">
      <ContributionHeader
        title="Top Contributors"
        description="Celebrating those who made this possible."
        farewellId={id}
      />

      <LeaderboardList initialData={leaderboardData} farewellId={id} />
    </div>
  );
}
