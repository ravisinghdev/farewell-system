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

export async function getAlbumsAction(
  farewellId: string,
  page: number = 1,
  limit: number = 12
) {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("albums")
    .select("*, created_by_user:users(full_name)", { count: "exact" })
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Get albums error:", error);
    return { data: [], total: 0 };
  }

  return { data, total: count || 0 };
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

// Batch save media records (Metadata only)
export async function saveMediaBatchAction(
  farewellId: string,
  albumId: string,
  mediaItems: { url: string; type: string }[]
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  if (!mediaItems || mediaItems.length === 0)
    return { error: "No items to save" };

  const records = mediaItems.map((item) => ({
    album_id: albumId,
    url: item.url,
    type: item.type,
    uploaded_by: userId,
  }));

  const { error } = await supabase.from("gallery_media").insert(records);

  if (error) {
    console.error("Batch save error:", error);
    return { error: "Failed to save media records" };
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
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };

  // 1. Get the media URL to extract file path
  // We can use the user client here to ensure they can at least SEE the media they are trying to delete
  const { data: media, error: fetchError } = await supabase
    .from("gallery_media")
    .select("url")
    .eq("id", mediaId)
    .single();

  if (fetchError || !media) {
    console.error("Fetch media error during delete:", fetchError);
    return { error: "Media not found" };
  }

  const adminClient = createAdminClient();

  // Extract file path from URL and delete from Storage
  try {
    const urlParts = media.url.split("/memories/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error: storageError } = await adminClient.storage
        .from("memories")
        .remove([filePath]);

      if (storageError) {
        console.warn("Storage delete warning:", storageError);
      }
    }
  } catch (e) {
    console.error("Error parsing media URL for deletion:", e);
  }

  // 2. Delete from DB using Admin Client to bypass RLS restrictions
  // (Assuming that if they could see it in the dashboard and clicked delete, they're authorized via UI checks)
  const { error, count } = await adminClient
    .from("gallery_media")
    .delete({ count: "exact" })
    .eq("id", mediaId);

  if (error) {
    console.error("Delete media error:", error);
    return { error: "Failed to delete media" };
  }

  if (count === 0) {
    return { error: "Media already deleted or could not be deleted" };
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
