import { RehearsalDetailClient } from "@/components/rehearsals/rehearsal-detail-client";
import {
  getRehearsalByIdAction,
  getFarewellMembersAction,
} from "@/app/actions/rehearsal-actions";
import { getDutiesAction } from "@/app/actions/duty-actions";
import {
  getFarewellRoleFromDB,
  isFarewellAdmin,
} from "@/lib/auth/roles-server";
import { createClient } from "@/utils/supabase/server";

interface RehearsalDetailPageProps {
  params: Promise<{
    id: string;
    rehearsalId: string;
  }>;
}

export default async function RehearsalDetailPage({
  params,
}: RehearsalDetailPageProps) {
  const { id: farewellId, rehearsalId } = await params;
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-10 text-center">
        Please log in to view this rehearsal.
      </div>
    );
  }

  // 2. Fetch Data in Parallel (Waterfall Optimization)
  const [rehearsalResult, role, isAdmin, members, duties] = await Promise.all([
    getRehearsalByIdAction(rehearsalId),
    getFarewellRoleFromDB(farewellId, user.id),
    isFarewellAdmin(farewellId, user.id),
    getFarewellMembersAction(farewellId),
    getDutiesAction(farewellId),
  ]);

  if (!rehearsalResult || !rehearsalResult.rehearsal) {
    return <div className="p-10 text-center">Rehearsal not found</div>;
  }

  return (
    <RehearsalDetailClient
      farewellId={farewellId}
      rehearsalId={rehearsalId}
      initialRehearsal={rehearsalResult.rehearsal}
      currentUserRole={role!}
      currentUserId={user.id}
      // isAdmin prop is actually not on the interface anymore, removed it in previous step?
      // Wait, let me check the interface again.
      // The interface in previous step was updated to remove isAdmin and add currentUserId.
      // So I must match that.
      duties={duties as any}
      farewellMembers={members}
    />
  );
}
