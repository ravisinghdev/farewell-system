"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Support Tickets ---
export async function getSupportTicketsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check if admin
  // We can't easily check admin status here without another query or helper,
  // but the RLS policy handles the security.
  // However, for UI purposes, we might want to know.
  // For now, we just fetch. RLS will filter: users see own, admins see all.

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function createSupportTicketAction(
  farewellId: string,
  data: {
    subject: string;
    message: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("support_tickets").insert({
    farewell_id: farewellId,
    user_id: user.id,
    ...data,
    status: "open",
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/support`);
  return { success: true };
}

export async function updateTicketStatusAction(
  id: string,
  farewellId: string,
  status: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/support`);
  return { success: true };
}

// --- About Stats ---
export async function getAboutStatsAction(farewellId: string) {
  const supabase = await createClient();

  // Parallel fetch for stats
  const [members, quotes, videos] = await Promise.all([
    supabase
      .from("farewell_members")
      .select("id", { count: "exact", head: true })
      .eq("farewell_id", farewellId),
    supabase
      .from("legacy_quotes")
      .select("id", { count: "exact", head: true })
      .eq("farewell_id", farewellId),
    supabase
      .from("legacy_videos")
      .select("id", { count: "exact", head: true })
      .eq("farewell_id", farewellId),
  ]);

  return {
    membersCount: members.count || 0,
    memoriesCount: (quotes.count || 0) + (videos.count || 0),
    funLevel: "∞", // Static fun
  };
}
