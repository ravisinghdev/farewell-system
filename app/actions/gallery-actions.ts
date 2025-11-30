"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createAlbumSchema = z.object({
  name: z.string().min(1, "Name is required"),
  farewellId: z.string().min(1, "Farewell ID is required"),
});

import { ActionState } from "@/types/custom";

export async function createAlbumAction(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const rawData = {
    name: formData.get("name"),
    farewellId: formData.get("farewellId"),
  };

  const parsed = createAlbumSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  const { name, farewellId } = parsed.data;

  const { error } = await supabase.from("albums").insert({
    farewell_id: farewellId,
    name,
    created_by: user.id,
  });

  if (error) {
    console.error("Create album error:", error);
    return { error: "Failed to create album" };
  }

  revalidatePath(`/dashboard/${farewellId}/memories`);
  return { success: true };
}

export async function getAlbumsAction(farewellId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("albums")
    .select("*, created_by_user:users(full_name)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get albums error:", error);
    return [];
  }

  return data;
}

export async function getAlbumMediaAction(albumId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_media")
    .select("*, uploaded_by_user:users(full_name)")
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get media error:", error);
    return [];
  }

  return data;
}

export async function uploadMediaAction(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const albumId = formData.get("albumId") as string;
  const farewellId = formData.get("farewellId") as string;
  const file = formData.get("file") as File | null;

  if (!albumId || !file) return { error: "Missing data" };

  // 1. Upload to Storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${albumId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;

  // Determine type
  const type = file.type.startsWith("video/") ? "video" : "image";

  const { error: uploadError } = await supabase.storage
    .from("memories")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Failed to upload file" };
  }

  // 2. Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from("memories")
    .getPublicUrl(fileName);

  // 3. Insert into DB
  const { error: dbError } = await supabase.from("gallery_media").insert({
    album_id: albumId,
    url: publicUrlData.publicUrl,
    type,
    uploaded_by: user.id,
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { error: "Failed to save media record" };
  }

  revalidatePath(`/dashboard/${farewellId}/memories/${albumId}`);
  return { success: true };
}
