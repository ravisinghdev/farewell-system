"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Rehearsals CRUD ---

export async function createRehearsalAction(
  farewellId: string,
  data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    venue?: string;
    rehearsal_type: string; // 'dance', 'music', etc.
  }
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const { data: rehearsal, error } = await supabase
      .from("rehearsals")
      .insert({
        farewell_id: farewellId,
        title: data.title,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        venue: data.venue,
        rehearsal_type: data.rehearsal_type,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/dashboard/${farewellId}/rehearsals`);
    return { success: true, data: rehearsal };
  } catch (error: any) {
    console.error("Error creating rehearsal:", error);
    return { error: error.message };
  }
}

export async function getRehearsalsAction(farewellId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rehearsals")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching rehearsals:", error);
    return [];
  }

  return data;
}

export async function getRehearsalByIdAction(rehearsalId: string) {
  const supabase = await createClient();

  // Fetch rehearsal with participants and segments
  const { data: rehearsal, error } = await supabase
    .from("rehearsals")
    .select(
      `
        *,
        participants:rehearsal_participants(
            *,
            user:users(id, full_name, avatar_url, email)
        ),
        segments:rehearsal_segments(*)
      `
    )
    .eq("id", rehearsalId)
    .single();

  if (error) {
    console.error("Error fetching rehearsal details:", error);
    return null;
  }

  console.log("Rehearsal Data Fetched:", rehearsal);

  if (!rehearsal) return null;

  // Sort segments by order_index
  if (rehearsal.segments) {
    rehearsal.segments.sort((a: any, b: any) => a.order_index - b.order_index);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { rehearsal, currentUserId: user?.id };
}

export async function updateRehearsalStatusAction(
  rehearsalId: string,
  farewellId: string,
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const updateData: any = { status };

    // If starting, maybe lock editing?
    if (status === "ongoing") {
      updateData.is_locked = true;
    }

    const { error } = await supabase
      .from("rehearsals")
      .update(updateData)
      .eq("id", rehearsalId);

    if (error) throw error;

    revalidatePath(`/dashboard/${farewellId}/rehearsals`);
    revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteRehearsalAction(
  rehearsalId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rehearsals")
    .delete()
    .eq("id", rehearsalId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/rehearsals`);
  return { success: true };
}

export async function duplicateRehearsalAction(
  rehearsalId: string,
  farewellId: string,
  newDate: string // YYYY-MM-DD
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    // 1. Fetch original rehearsal
    const { data: original, error: fetchError } = await supabase
      .from("rehearsals")
      .select("*, participants:rehearsal_participants(user_id, role)")
      .eq("id", rehearsalId)
      .single();

    if (fetchError || !original)
      throw new Error("Original rehearsal not found");

    // 2. Calculate new start/end times based on newDate but keeping same time
    const oldStart = new Date(original.start_time);
    const oldEnd = new Date(original.end_time);
    const targetDate = new Date(newDate);

    // Set new start time
    const newStart = new Date(targetDate);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);

    // Set new end time (preserve duration)
    const durationMs = oldEnd.getTime() - oldStart.getTime();
    const newEnd = new Date(newStart.getTime() + durationMs);

    // 3. Create new Rehearsal
    const { data: newRehearsal, error: createError } = await supabase
      .from("rehearsals")
      .insert({
        farewell_id: farewellId,
        title: `${original.title} (Copy)`,
        description: original.description,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        venue: original.venue,
        rehearsal_type: original.rehearsal_type,
        status: "scheduled",
      })
      .select()
      .single();

    if (createError) throw createError;

    // 4. Duplicate Participants
    if (original.participants && original.participants.length > 0) {
      const participantsToInsert = original.participants.map((p: any) => ({
        rehearsal_id: newRehearsal.id,
        user_id: p.user_id,
        role: p.role,
        attendance_status: "absent", // Reset attendance
        farewell_id: farewellId,
        readiness_status: {}, // Reset readiness
      }));

      const { error: partError } = await supabase
        .from("rehearsal_participants")
        .insert(participantsToInsert);

      if (partError) {
        console.error("Error duplicating participants", partError);
      }
    }

    revalidatePath(`/dashboard/${farewellId}/rehearsals`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
