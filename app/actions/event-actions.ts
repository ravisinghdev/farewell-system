"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Event Details ---
export async function getEventDetailsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farewell_event_details")
    .select("*")
    .eq("farewell_id", farewellId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "The result contains 0 rows"
    console.error("Error fetching event details:", error);
    return null;
  }
  return data;
}

export async function updateEventDetailsAction(
  farewellId: string,
  data: {
    event_date?: string;
    event_time?: string;
    venue?: string;
    agenda?: any[];
  }
): Promise<ActionState> {
  const supabase = await createClient();

  // Check if exists
  const { data: existing } = await supabase
    .from("farewell_event_details")
    .select("id")
    .eq("farewell_id", farewellId)
    .single();

  let error;
  if (existing) {
    const { error: updateError } = await supabase
      .from("farewell_event_details")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("farewell_id", farewellId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("farewell_event_details")
      .insert({ farewell_id: farewellId, ...data });
    error = insertError;
  }

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/farewell-event`);
  return { success: true };
}

// --- Rehearsals ---
export async function getRehearsalsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehearsals")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("start_time", { ascending: true });

  if (error) return [];
  return data;
}

export async function createRehearsalAction(
  farewellId: string,
  data: {
    title: string;
    start_time: string;
    end_time: string;
    venue: string;
    notes: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("rehearsals").insert({
    farewell_id: farewellId,
    ...data,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/rehearsals`);
  return { success: true };
}

export async function deleteRehearsalAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("rehearsals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/rehearsals`);
  return { success: true };
}

// --- Performances ---
export async function getPerformancesAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data, error } = await supabase
      .from("performances")
      .select(
        `
        *,
        votes:performance_votes(count),
        user_vote:performance_votes(id)
      `
      )
      .eq("farewell_id", farewellId)
      .eq("user_vote.user_id", user?.id) // Filter user_vote by current user
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform data to include vote_count and has_voted
    const transformedData = data.map((item) => ({
      ...item,
      vote_count: item.votes?.[0]?.count || 0,
      has_voted: item.user_vote && item.user_vote.length > 0,
    }));

    return { data: transformedData };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createPerformanceAction(
  farewellId: string,
  data: {
    title: string;
    type: string;
    performers: string[];
    duration?: string;
    video_url?: string;
  }
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("performances").insert({
      farewell_id: farewellId,
      title: data.title,
      type: data.type,
      performers: data.performers,
      duration: data.duration,
      video_url: data.video_url,
    });

    if (error) throw error;
    revalidatePath(`/dashboard/${farewellId}/performances`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePerformanceStatusAction(
  id: string,
  farewellId: string,
  status: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("performances")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/performances`);
  return { success: true };
}

export async function deletePerformanceAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("performances").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/performances`);
  return { success: true };
}

export async function voteForPerformanceAction(performanceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { error } = await supabase.from("performance_votes").insert({
      performance_id: performanceId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function removeVoteForPerformanceAction(performanceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { error } = await supabase
      .from("performance_votes")
      .delete()
      .eq("performance_id", performanceId)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- Decor Items ---
export async function getDecorItemsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decor_items")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("category", { ascending: true });

  if (error) return [];
  return data;
}

export async function createDecorItemAction(
  farewellId: string,
  data: {
    item_name: string;
    category: string;
    quantity: number;
    notes: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("decor_items").insert({
    farewell_id: farewellId,
    ...data,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/decor`);
  return { success: true };
}

export async function updateDecorStatusAction(
  id: string,
  farewellId: string,
  status: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("decor_items")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/decor`);
  return { success: true };
}

export async function deleteDecorItemAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("decor_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/decor`);
  return { success: true };
}

// --- Event Tasks ---
export async function getEventTasksAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_tasks")
    .select("*, assigned_to:users(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function createEventTaskAction(
  farewellId: string,
  data: {
    title: string;
    description: string;
    priority: string;
    assigned_to?: string;
    due_date?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_tasks").insert({
    farewell_id: farewellId,
    ...data,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}

export async function updateTaskStatusAction(
  id: string,
  farewellId: string,
  status: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_tasks")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}

export async function deleteEventTaskAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}
