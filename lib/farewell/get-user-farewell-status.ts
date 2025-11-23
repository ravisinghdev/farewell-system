import { createClient } from "@/utils/supabase/server";

export interface FarewellStatusResult {
  status: "none" | "pending" | "approved";
  farewellId?: string;
}

export async function getUserFarewellStatus(userId: string): Promise<FarewellStatusResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("farewell_participants")
    .select("farewell_id, status")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .maybeSingle();

  if (error || !data) {
    return { status: "none" };
  }

  if (data.status === "approved") {
    return {
      status: "approved",
      farewellId: data.farewell_id,
    };
  }

  if (data.status === "pending") {
    return { status: "pending" };
  }

  return { status: "none" };
}
