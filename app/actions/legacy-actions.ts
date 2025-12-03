"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- QUOTES ---

export async function getQuotesAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legacy_quotes")
    .select("*, submitted_by:users(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createQuoteAction(
  farewellId: string,
  content: string,
  author: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("legacy_quotes").insert({
    farewell_id: farewellId,
    content,
    author,
    submitted_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${farewellId}/quotes`);
}

// --- VIDEOS ---

export async function getVideosAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legacy_videos")
    .select("*, uploaded_by:users(full_name)")
    .eq("farewell_id", farewellId)
    .order("is_main", { ascending: false }) // Main video first
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createVideoAction(
  farewellId: string,
  title: string,
  description: string,
  videoUrl: string,
  thumbnailUrl: string,
  isMain: boolean = false
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // If setting as main, unset others
  if (isMain) {
    await supabase
      .from("legacy_videos")
      .update({ is_main: false })
      .eq("farewell_id", farewellId);
  }

  const { error } = await supabase.from("legacy_videos").insert({
    farewell_id: farewellId,
    title,
    description,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
    is_main: isMain,
    uploaded_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${farewellId}/farewell-video`);
}

// --- GIFTS ---

export async function getGiftsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legacy_gifts")
    .select("*, sender_id:users(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createGiftAction(
  farewellId: string,
  message: string,
  giftType: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("legacy_gifts").insert({
    farewell_id: farewellId,
    message,
    sender_id: user.id,
    gift_type: giftType,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${farewellId}/gift-wall`);
}

// --- THANK YOU NOTES ---

export async function getThankYouNotesAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legacy_thank_you_notes")
    .select("*, author_id:users(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createThankYouNoteAction(
  farewellId: string,
  content: string,
  recipientName: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("legacy_thank_you_notes").insert({
    farewell_id: farewellId,
    content,
    recipient_name: recipientName,
    author_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${farewellId}/thankyou`);
}
