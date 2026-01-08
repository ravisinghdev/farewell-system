import { Suspense } from "react";
import {
  getDutiesAction,
  getFarewellMembersAction,
} from "@/app/actions/duty-actions";
import { createClient } from "@/utils/supabase/server";
import { isFarewellAdmin } from "@/lib/auth/roles-server";
import { FinancialOverview } from "@/components/duties/v4/financial-overview";
import { VolunteerLeaderboard } from "@/components/duties/v4/volunteer-leaderboard";
import { DutyBoard } from "@/components/tasks/duty-board";

export const dynamic = "force-dynamic";

export default async function DutiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farewellId = id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user ? await isFarewellAdmin(id, user.id) : false;

  // Parallel Fetch for Unified Board
  const [duties, members] = await Promise.all([
    getDutiesAction(id),
    getFarewellMembersAction(id),
  ]);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden pt-16">
      {/* 
          FRESH UI: No Background Colors 
          We rely on the main layout's background. 
          This container is transparent.
      */}

      <div className="flex flex-col h-full space-y-6">
        {/* Top Section: Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 shrink-0">
          <div className="lg:col-span-3">
            <FinancialOverview duties={duties} isAdmin={isAdmin} />
          </div>
          <div className="h-full">
            <VolunteerLeaderboard farewellId={id} />
          </div>
        </div>

        {/* Main Board Area */}
        <div className="flex-1 min-h-0">
          <DutyBoard
            initialDuties={duties}
            farewellMembers={members}
            farewellId={farewellId}
            currentUserId={user?.id}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
