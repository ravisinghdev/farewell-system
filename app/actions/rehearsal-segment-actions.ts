"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Segments Management ---

export async function createSegmentAction(
  rehearsalId: string,
  farewellId: string,
  data: {
    title: string;
    description?: string;
    duration_minutes: number;
    order_index: number;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("rehearsal_segments").insert({
      rehearsal_id: rehearsalId,
      ...data,
      status: "pending",
    });

    if (error) throw error;

    revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSegmentStatusAction(
  segmentId: string,
  rehearsalId: string,
  farewellId: string,
  status: "pending" | "running" | "completed" | "skipped"
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("rehearsal_segments")
      .update({ status })
      .eq("id", segmentId);

    if (error) throw error;

    revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function reorderSegmentsAction(
  rehearsalId: string,
  farewellId: string,
  orderedSegmentIds: string[]
): Promise<ActionState> {
  const supabase = await createClient();

  try {
    // We need to update multiple rows.
    // A simple way is to loop, though not atomic.
    // Better is to use an RPC or a single query with case match,
    // but for now, loop is acceptable for small number of segments.

    const updates = orderedSegmentIds.map((id, index) =>
      supabase
        .from("rehearsal_segments")
        .update({ order_index: index })
        .eq("id", id)
    );

    await Promise.all(updates);

    revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSegmentAction(
  segmentId: string,
  rehearsalId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rehearsal_segments")
    .delete()
    .eq("id", segmentId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/rehearsals/${rehearsalId}`);
  return { success: true };
}
