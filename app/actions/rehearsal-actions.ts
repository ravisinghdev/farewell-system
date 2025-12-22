"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Rehearsals CRUD (Adapted for Next-Gen Schema: rehearsal_sessions) ---

export async function createRehearsalAction(
  farewellId: string,
  data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    venue?: string;
    rehearsal_type: string;
    performance_id?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  // DEBUG: Verify Authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("DEBUG: User not authenticated:", authError);
    return { error: "User not authenticated. Please log in again." };
  }
  console.log("DEBUG: Authenticated User:", user.id, "Role:", user.role);

  try {
    const { data: rehearsal, error } = await supabase
      .from("rehearsal_sessions")
      .insert({
        farewell_id: farewellId,
        title: data.title,
        goal: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        venue: data.venue,
        performance_id: data.performance_id || null, // Ensure this column exists
        is_mandatory: true,
      })
      .select()
      .single();

    if (error) {
      console.error("DEBUG: Insert failed:", error);
      throw error;
    }

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
    .from("rehearsal_sessions")
    .select(
      `
      *,
      performance:performances(title, lead_coordinator_id)
    `
    )
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

  // Fetch rehearsal with linked performance
  const { data: rehearsal, error } = await supabase
    .from("rehearsal_sessions")
    .select(
      `
        *,
        performance:performances(*)
      `
    )
    .eq("id", rehearsalId)
    .single();

  if (error) {
    console.error("Error fetching rehearsal details:", error);
    return null;
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
    const { error } = await supabase
      .from("rehearsal_sessions")
      .update({ status })
      .eq("id", rehearsalId);

    if (error) throw error;

    revalidatePath(`/dashboard/${farewellId}/rehearsals`);
    revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- Metadata & Participants ---

export async function getFarewellMembersAction(farewellId: string) {
  const supabase = await createClient();

  // Fetch all members of the farewell
  const { data, error } = await supabase
    .from("farewell_members")
    .select(
      `
      user_id,
      user:users(id, email, full_name, avatar_url)
    `
    )
    .eq("farewell_id", farewellId);

  if (error) {
    console.error("Error fetching members:", error);
    return [];
  }

  // Flatten and return unique users
  return data.map((d: any) => d.user).filter((u) => u);
}

export async function updateRehearsalMetadataAction(
  rehearsalId: string,
  farewellId: string,
  metadata: any
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("rehearsal_sessions")
      .update({ metadata })
      .eq("id", rehearsalId);

    if (error) throw error;

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
    .from("rehearsal_sessions")
    .delete()
    .eq("id", rehearsalId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/rehearsals`);
  return { success: true };
}

// --- Attendance (JSONB) ---

export async function updateAttendanceAction(
  rehearsalId: string,
  farewellId: string,
  userId: string,
  status: "present" | "absent" | "late"
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    // 1. Fetch current attendance
    const { data: rehearsal, error: fetchError } = await supabase
      .from("rehearsal_sessions")
      .select("attendance")
      .eq("id", rehearsalId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Update JSON
    const currentAttendance = rehearsal.attendance || {};
    const updatedAttendance = {
      ...currentAttendance,
      [userId]: {
        status,
        timestamp: new Date().toISOString(),
      },
    };

    // 3. Save back
    const { error: updateError } = await supabase
      .from("rehearsal_sessions")
      .update({ attendance: updatedAttendance })
      .eq("id", rehearsalId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function duplicateRehearsalAction(
  rehearsalId: string,
  farewellId: string,
  newDate: string
): Promise<ActionState> {
  const supabase = await createClient();
  try {
    const { data: original } = await supabase
      .from("rehearsal_sessions")
      .select("*")
      .eq("id", rehearsalId)
      .single();
    if (!original) throw new Error("Original not found");

    const newStart = new Date(newDate);
    const { error } = await supabase.from("rehearsal_sessions").insert({
      ...original,
      id: undefined,
      created_at: undefined,
      title: original.title + " (Copy)",
      start_time: newStart.toISOString(),
      status: "scheduled",
    });
    if (error) throw error;
    revalidatePath(`/dashboard/${farewellId}/rehearsals`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
