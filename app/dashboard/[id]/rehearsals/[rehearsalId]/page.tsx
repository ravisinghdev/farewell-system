import { RehearsalDetailClient } from "@/components/rehearsals/rehearsal-detail-client";
import { getRehearsalByIdAction } from "@/app/actions/rehearsal-actions";
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
  const [rehearsalResult, role, isAdmin] = await Promise.all([
    getRehearsalByIdAction(rehearsalId),
    getFarewellRoleFromDB(farewellId, user.id),
    isFarewellAdmin(farewellId, user.id),
  ]);

  if (!rehearsalResult || !rehearsalResult.rehearsal) {
    return <div className="p-10 text-center">Rehearsal not found</div>;
  }

  // console.log("--- DEBUG REHEARSAL PAGE ---");
  // console.log("User ID:", user.id);
  // console.log("Farewell ID:", farewellId);
  // console.log("Fetched Role:", role);
  // console.log("Is Admin:", isAdmin);
  // console.log("----------------------------");

  return (
    <RehearsalDetailClient
      farewellId={farewellId}
      rehearsalId={rehearsalId}
      initialRehearsal={rehearsalResult.rehearsal}
      currentUserRole={role}
      isAdmin={isAdmin}
    />
  );
}
