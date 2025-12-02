import { getLeaderboardAction } from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { LeaderboardList } from "@/components/contributions/leaderboard-list";

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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Top Contributors
        </h1>
        <p className="text-white/60">
          Celebrating those who made this possible.
        </p>
      </div>

      <LeaderboardList initialData={leaderboardData} farewellId={id} />
    </div>
  );
}
