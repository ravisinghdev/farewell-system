"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionState } from "@/types/custom";

const createArtworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  artistName: z.string().optional(),
  farewellId: z.string().min(1, "Farewell ID is required"),
});

export async function getArtworksAction(
  farewellId: string,
  page: number = 1,
  limit: number = 12
) {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("artworks")
    .select("*, created_by_user:users(full_name)", { count: "exact" })
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Get artworks error:", error);
    return { data: [], total: 0 };
  }

  return { data, total: count || 0 };
}

export async function createArtworkAction(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Not authenticated" };
  const userId = claimsData.claims.sub;

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    artistName: formData.get("artistName"),
    farewellId: formData.get("farewellId"),
  };

  const parsed = createArtworkSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Artwork image is required" };

  const { title, description, artistName, farewellId } = parsed.data;

  // 1. Upload to Storage
  const fileExt = file.name.split(".").pop();
  const fileName = `artworks/${farewellId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;

  const adminClient = createAdminClient();
  const { error: uploadError } = await adminClient.storage
    .from("memories") // Reusing memories bucket for now
    .upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Failed to upload artwork" };
  }

  // 2. Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from("memories")
    .getPublicUrl(fileName);

  // 3. Insert into DB
  const { error: dbError } = await supabase.from("artworks").insert({
    farewell_id: farewellId,
    title,
    description,
    artist_name: artistName || claimsData.claims.user_metadata?.full_name,
    image_url: publicUrlData.publicUrl,
    created_by: userId,
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { error: "Failed to save artwork record" };
  }

  revalidatePath(`/dashboard/${farewellId}/artworks`);
  return { success: true };
}

export async function deleteArtworkAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return { error: "Not authenticated" };

  // Use Admin Client to bypass RLS restrictions to ensure deletion
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("artworks").delete().eq("id", id);

  if (error) {
    console.error("Delete artwork error:", error);
    return { error: "Failed to delete artwork" };
  }

  revalidatePath(`/dashboard/${farewellId}/artworks`);
  return { success: true };
}
