"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Templates ---
export async function getTemplatesAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_templates")
    .select("*, member:farewell_members(name, user:users(avatar_url))")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function createTemplateAction(
  farewellId: string,
  data: {
    title: string;
    description: string;
    file_url: string;
    category: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch member_id
  const { data: member } = await supabase
    .from("farewell_members")
    .select("id")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "Member not found" };

  const { error } = await supabase.from("resource_templates").insert({
    farewell_id: farewellId,
    ...data,
    uploaded_by: user.id,
    member_id: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/templates`);
  return { success: true };
}

export async function deleteTemplateAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("resource_templates")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/templates`);
  return { success: true };
}

// --- Music ---
export async function getMusicAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_music")
    .select("*, member:farewell_members(name, user:users(avatar_url))")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function createMusicAction(
  farewellId: string,
  data: {
    title: string;
    artist: string;
    duration: string;
    file_url: string;
    category: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch member_id
  const { data: member } = await supabase
    .from("farewell_members")
    .select("id")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "Member not found" };

  const { error } = await supabase.from("resource_music").insert({
    farewell_id: farewellId,
    ...data,
    uploaded_by: user.id,
    member_id: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/music-library`);
  return { success: true };
}

export async function deleteMusicAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("resource_music").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/music-library`);
  return { success: true };
}

// --- Downloads ---
export async function getDownloadsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_downloads")
    .select("*, member:farewell_members(name, user:users(avatar_url))")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function createDownloadAction(
  farewellId: string,
  data: {
    title: string;
    file_url: string;
    file_size: string;
    category: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch member_id
  const { data: member } = await supabase
    .from("farewell_members")
    .select("id")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "Member not found" };

  const { error } = await supabase.from("resource_downloads").insert({
    farewell_id: farewellId,
    ...data,
    uploaded_by: user.id,
    member_id: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/downloads`);
  return { success: true };
}

export async function deleteDownloadAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("resource_downloads")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/downloads`);
  return { success: true };
}
