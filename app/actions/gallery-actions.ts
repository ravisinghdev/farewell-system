"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
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
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

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
    created_by: userId,
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
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

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

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
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
    uploaded_by: userId,
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { error: "Failed to save media record" };
  }

  revalidatePath(`/dashboard/${farewellId}/memories/${albumId}`);
  return { success: true };
}

export async function deleteMediaAction(
  mediaId: string,
  farewellId: string,
  albumId: string
): Promise<ActionState> {
  const supabase = await createClient();

  // 1. Get the media to find the file path (optional clean up from storage, not strictly required for MVP but good practice)
  // For now, we'll just delete the DB record.
  // Ideally, use a trigger or separate cleanup job for storage to avoid complex cascading permission issues in client code.

  const { error } = await supabase
    .from("gallery_media")
    .delete()
    .eq("id", mediaId);

  if (error) {
    console.error("Delete media error:", error);
    return { error: "Failed to delete media" };
  }

  revalidatePath(`/dashboard/${farewellId}/memories/${albumId}`);
  return { success: true };
}

export async function saveMediaRecordAction(
  albumId: string,
  farewellId: string,
  url: string,
  type: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const { error } = await supabase.from("gallery_media").insert({
    album_id: albumId,
    url,
    type,
    uploaded_by: userId,
  });

  if (error) {
    console.error("Save media error:", error);
    return { error: "Failed to save media record" };
  }

  revalidatePath(`/dashboard/${farewellId}/memories/${albumId}`);
  return { success: true };
}
