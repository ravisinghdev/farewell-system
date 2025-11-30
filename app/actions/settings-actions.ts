"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSettings(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching settings:", error);
    return null;
  }

  // If no settings exist, return defaults (or create them lazily)
  if (!data) {
    return {
      theme: "system",
      language: "en",
      notifications_email_communication: false,
      notifications_email_social: true,
      notifications_email_marketing: false,
      notifications_email_security: true,
      notifications_farewell_updates: true,
    };
  }

  return data;
}

export async function updateSettings(userId: string, data: any) {
  const supabase = await createClient();

  // Check if settings exist
  const { data: existing } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  let error;
  if (existing) {
    const { error: updateError } = await supabase
      .from("user_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("user_settings")
      .insert({ ...data, user_id: userId });
    error = insertError;
  }

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to update settings");
  }

  revalidatePath("/dashboard/[id]/settings");
  return { success: true };
}

export async function updateProfile(
  userId: string,
  data: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  }
) {
  const supabase = await createClient();

  // Update public.users table
  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.full_name,
      username: data.username,
      avatar_url: data.avatar_url,
      bio: data.bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }

  // Sync with Auth Metadata so getUser() returns fresh data
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: data.full_name,
      username: data.username,
      avatar_url: data.avatar_url,
      bio: data.bio, // Optional, but good to keep in sync if needed
    },
  });

  if (authError) {
    console.error("Error updating auth metadata:", authError);
    // We don't throw here to avoid breaking the flow if only metadata fails,
    // but ideally they should be in sync.
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/[id]");
  revalidatePath("/dashboard/[id]/settings/profile");
  return { success: true };
}
