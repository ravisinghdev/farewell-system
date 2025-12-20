"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { UserPreferences, userPreferencesSchema } from "@/lib/settings/schema";
import { z } from "zod";

// Helper to safe merge (simplified version of lib/settings/service one)
function safeMerge(target: any, source: any): any {
  if (typeof target !== "object" || target === null) return source;
  if (typeof source !== "object" || source === null) return target;
  const output = { ...target };
  Object.keys(source).forEach((key) => {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!(key in target)) Object.assign(output, { [key]: source[key] });
      else output[key] = safeMerge(target[key], source[key]);
    } else {
      Object.assign(output, { [key]: source[key] });
    }
  });
  return output;
}

export async function getUserProfileSettingsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("users")
    .select("full_name, email, avatar_url, preferences")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch profile");
  }

  // Ensure preferences match schema structure with defaults
  const defaults = {
    theme: "system",
    bio: "",
    phone: "",
    notifications: {
      enable_email_notifications: true,
      enable_push_notifications: true,
      enable_whatsapp_notifications: false,
    },
  };
  const preferences = safeMerge(defaults, data.preferences || {});

  return {
    ...data,
    preferences: preferences as UserPreferences,
  };
}

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  avatar_url: z.string().optional(),
  preferences: userPreferencesSchema,
});

export async function updateUserProfileSettingsAction(
  data: z.infer<typeof updateProfileSchema>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  // Update users table
  const { error } = await supabase
    .from("users")
    .update({
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url,
      preferences: parsed.data.preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
