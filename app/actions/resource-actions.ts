"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";
import { checkIsAdmin } from "@/lib/auth/roles";

export type ResourceType = "template" | "music" | "download";

export async function getResourcesAction(
  farewellId: string,
  type: ResourceType
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*, member:farewell_members(user:users(full_name, avatar_url))")
    .eq("farewell_id", farewellId)
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching resources (${type}):`, error);
    return [];
  }
  return data;
}

export async function createResourceAction(
  farewellId: string,
  data: {
    type: ResourceType;
    title: string;
    description?: string;
    file_path: string;
    file_url: string;
    category?: string;
    metadata?: any;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch member_id and role
  const { data: member } = await supabase
    .from("farewell_members")
    .select("id, role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "Member not found" };
  if (!checkIsAdmin(member.role)) return { error: "Unauthorized access" };

  const { error } = await supabase.from("resources").insert({
    farewell_id: farewellId,
    ...data,
    uploaded_by: user.id,
    member_id: member.id,
  });

  if (error) return { error: error.message };

  // Revalidate the specific page based on type
  const pathMap: Record<ResourceType, string> = {
    template: "templates",
    music: "music-library",
    download: "downloads",
  };
  revalidatePath(`/dashboard/${farewellId}/${pathMap[data.type]}`);

  return { success: true };
}

export async function deleteResourceAction(
  id: string,
  farewellId: string,
  type: ResourceType
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (!member || !checkIsAdmin(member.role)) {
    return { error: "Unauthorized access" };
  }

  // 1. Get resource to delete file from storage
  const { data: resource } = await supabase
    .from("resources")
    .select("file_path")
    .eq("id", id)
    .single();

  if (resource?.file_path) {
    // Attempt to delete from storage (ignoring error if file missing)
    await supabase.storage
      .from("farewell_resources")
      .remove([resource.file_path]);
  }

  // 2. Delete record
  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) return { error: error.message };

  const pathMap: Record<ResourceType, string> = {
    template: "templates",
    music: "music-library",
    download: "downloads",
  };
  revalidatePath(`/dashboard/${farewellId}/${pathMap[type]}`);

  return { success: true };
}
