"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

export interface AlumniMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_public: boolean;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
    // We could fetch role here if needed to verify they are alumni
  };
}

export async function getAlumniMessagesAction(farewellId: string) {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("alumni_messages")
    .select(
      `
      *,
      sender:users(full_name, avatar_url)
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching alumni messages:", error);
    return [];
  }

  return messages as AlumniMessage[];
}

export async function createAlumniMessageAction(
  farewellId: string,
  content: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Optional: Verify user is an alumni?
  // For now, we allow anyone to post, but UI can label them.

  const { error } = await supabase.from("alumni_messages").insert({
    farewell_id: farewellId,
    sender_id: user.id,
    content,
  });

  if (error) {
    console.error("Error creating alumni message:", error);
    return { error: "Failed to create message" };
  }

  revalidatePath(`/dashboard/${farewellId}/alumni`);
  return { success: true };
}

export async function deleteAlumniMessageAction(
  messageId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("alumni_messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) {
    console.error("Error deleting alumni message:", error);
    return { error: "Failed to delete message" };
  }

  revalidatePath(`/dashboard/${farewellId}/alumni`);
  return { success: true };
}
