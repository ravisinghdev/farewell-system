"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Get rehearsal session with all related data
export async function getRehearsalSessionAction(sessionId: string) {
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("rehearsal_sessions")
    .select(
      `
      *,
      farewell:farewells(id, name),
      performance:performances(id, title)
    `
    )
    .eq("id", sessionId)
    .single();

  if (sessionError) {
    return { error: sessionError.message };
  }

  // Get all participants for this farewell
  const { data: farewellMembers } = await supabase
    .from("farewell_members")
    .select(
      `
      user:users(id, full_name, avatar_url, email)
    `
    )
    .eq("farewell_id", session.farewell_id);

  // Get attendance records
  const { data: attendanceRecords } = await supabase
    .from("rehearsal_attendance")
    .select("*")
    .eq("session_id", sessionId);

  // Create a map of attendance by user_id
  const attendanceMap = new Map(
    (attendanceRecords || []).map((record) => [record.user_id, record])
  );

  // Merge participants with their attendance status
  const participants = (farewellMembers || [])
    .map((member) => {
      // Fix: Handle cases where member.user might be an array due to Supabase typing
      const userData = Array.isArray(member.user)
        ? member.user[0]
        : member.user;

      if (!userData) return null; // Skip if no user data

      const attendance = attendanceMap.get(userData.id);
      return {
        id: attendance?.id || `temp-${userData.id}`,
        user_id: userData.id,
        status: attendance?.status || ("absent" as const),
        check_in_time: attendance?.check_in_time || null,
        notes: attendance?.notes || null,
        user: userData,
      };
    })
    .filter(Boolean); // Filter out nulls

  // Get segments
  const { data: segments, error: segmentsError } = await supabase
    .from("rehearsal_segments")
    .select("*")
    .eq("rehearsal_id", sessionId)
    .order("order_index");

  return {
    session,
    participants,
    segments: segments || [],
  };
}

// Update attendance status
export async function updateAttendanceAction(
  sessionId: string,
  userId: string,
  status: "present" | "late" | "absent" | "excused"
) {
  const supabase = await createClient();

  const { error } = await supabase.from("rehearsal_attendance").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      status,
      check_in_time:
        status === "present" || status === "late"
          ? new Date().toISOString()
          : null,
    },
    { onConflict: "session_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/[id]/rehearsals/${sessionId}`);
  return { success: true };
}

// Self check-in
export async function selfCheckInAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const now = new Date();
  const { data: session } = await supabase
    .from("rehearsal_sessions")
    .select("start_time")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { error: "Session not found" };
  }

  const startTime = new Date(session.start_time);
  const isLate = now > startTime;

  const { error } = await supabase.from("rehearsal_attendance").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      status: isLate ? "late" : "present",
      check_in_time: now.toISOString(),
    },
    { onConflict: "session_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/[id]/rehearsals/${sessionId}`);
  return { success: true, status: isLate ? "late" : "present" };
}

// Update segment status
export async function updateSegmentStatusAction(
  segmentId: string,
  status: "pending" | "in_progress" | "completed" | "skipped"
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rehearsal_segments")
    .update({ status })
    .eq("id", segmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/[id]/rehearsals/[rehearsalId]`);
  return { success: true };
}

// Add participant to session
export async function addParticipantToSessionAction(
  sessionId: string,
  userId: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from("rehearsal_attendance").insert({
    session_id: sessionId,
    user_id: userId,
    status: "absent",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/[id]/rehearsals/${sessionId}`);
  return { success: true };
}

// Update attendance notes
export async function updateAttendanceNotesAction(
  sessionId: string,
  userId: string,
  notes: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rehearsal_attendance")
    .update({ notes })
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
