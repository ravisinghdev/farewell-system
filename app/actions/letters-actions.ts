"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

export interface Letter {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string | null;
  is_public: boolean;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  recipient?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getLettersAction(farewellId: string) {
  const supabase = await createClient();

  const { data: letters, error } = await supabase
    .from("letters")
    .select(
      `
      *,
      sender:users!letters_sender_id_fkey(full_name, avatar_url),
      recipient:users!letters_recipient_id_fkey(full_name, avatar_url)
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching letters:", error);
    return [];
  }

  return letters as Letter[];
}

export async function createLetterAction(
  farewellId: string,
  content: string,
  recipientId: string | null = null, // null = "To all seniors"
  isPublic: boolean = true
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { error } = await supabase.from("letters").insert({
    farewell_id: farewellId,
    sender_id: userId,
    recipient_id: recipientId === "all" ? null : recipientId,
    content,
    is_public: isPublic,
  });

  if (error) {
    console.error("Error creating letter:", error);
    return { error: "Failed to create letter" };
  }

  revalidatePath(`/dashboard/${farewellId}/letters`);
  return { success: true };
}

export async function deleteLetterAction(
  letterId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { error } = await supabase
    .from("letters")
    .delete()
    .eq("id", letterId)
    .eq("sender_id", userId);

  if (error) {
    console.error("Error deleting letter:", error);
    return { error: "Failed to delete letter" };
  }

  revalidatePath(`/dashboard/${farewellId}/letters`);
  return { success: true };
}
