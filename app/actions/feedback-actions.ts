"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

export interface Feedback {
  id: string;
  content: string;
  type: "feedback" | "suggestion" | "bug" | "other";
  status: "new" | "reviewed" | "implemented" | "rejected";
  created_at: string;
  user_id: string;
  is_anonymous: boolean;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export async function getFeedbackAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check if admin
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  const isAdmin = member?.role === "admin" || member?.role === "main_admin";

  let query = supabase
    .from("feedback")
    .select(
      `
      *,
      user:users(full_name, avatar_url)
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  // If not admin, only show own feedback? Or maybe all feedback but anonymous?
  // Let's say only admins see all feedback for now.
  if (!isAdmin) {
    query = query.eq("user_id", user.id);
  }

  const { data: feedback, error } = await query;

  if (error) {
    console.error("Error fetching feedback:", error);
    return [];
  }

  return feedback as Feedback[];
}

export async function submitFeedbackAction(
  farewellId: string,
  content: string,
  type: "feedback" | "suggestion" | "bug" | "other",
  isAnonymous: boolean = false
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("feedback").insert({
    farewell_id: farewellId,
    user_id: user.id,
    content,
    type,
    is_anonymous: isAnonymous,
  });

  if (error) {
    console.error("Error submitting feedback:", error);
    return { error: "Failed to submit feedback" };
  }

  revalidatePath(`/dashboard/${farewellId}/feedback`);
  return { success: true };
}
