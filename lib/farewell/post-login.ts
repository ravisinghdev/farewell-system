import { createClient } from "@/utils/supabase/server";
import { PostLoginDestination, JoinRequestStatus } from "./types";

interface FarewellMemberRow {
  farewell_id: string;
  active: boolean | null;
}

interface JoinRequestRow {
  farewell_id: string;
  status: JoinRequestStatus;
}

/**
 * Decide where to send the user after successful login.
 */
export async function getPostLoginDestination(
  userId: string
): Promise<PostLoginDestination> {
  const supabase = await createClient();

  // 1. Check existing membership
  const { data: member, error: memberError } = await supabase
    .from("farewell_members")
    .select<"farewell_id, active", FarewellMemberRow>("farewell_id, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (!memberError && member && member.farewell_id) {
    return { kind: "dashboard", farewellId: member.farewell_id };
  }

  // 2. Check if there is a pending join request
  const { data: joinReq, error: joinError } = await supabase
    .from("farewell_join_requests")
    .select<"farewell_id, status", JoinRequestRow>("farewell_id, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!joinError && joinReq) {
    if (joinReq.status === "pending") {
      return { kind: "pending-approval", farewellId: joinReq.farewell_id };
    }
    if (joinReq.status === "approved") {
      // In theory, approved requests should be converted into membership.
      // If we see this state, something is out-of-sync. For safety, send to welcome.
      return { kind: "welcome" };
    }
    // rejected -> force them to choose again
    if (joinReq.status === "rejected") {
      return { kind: "welcome" };
    }
  }

  // 3. No membership & no join request → go to welcome
  return { kind: "welcome" };
}
