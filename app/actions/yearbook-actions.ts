"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionState } from "@/types/custom";

const createEntrySchema = z.object({
  studentName: z.string().min(1, "Student Name is required"),
  quote: z.string().optional(),
  section: z.string().default("Students"),
  farewellId: z.string().min(1, "Farewell ID is required"),
});

export async function getYearbookEntriesAction(farewellId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("yearbook_entries")
    .select("*, created_by_user:users(full_name)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get yearbook entries error:", error);
    return [];
  }

  return data;
}

export async function createYearbookEntryAction(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const rawData = {
    studentName: formData.get("studentName"),
    quote: formData.get("quote"),
    section: formData.get("section"),
    farewellId: formData.get("farewellId"),
  };

  const parsed = createEntrySchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  const file = formData.get("file") as File | null;
  const { studentName, quote, section, farewellId } = parsed.data;

  let photoUrl = null;

  if (file) {
    // 1. Upload to Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `yearbook/${farewellId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from("memories") // Reusing memories bucket
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload photo" };
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("memories")
      .getPublicUrl(fileName);

    photoUrl = publicUrlData.publicUrl;
  }

  // 3. Insert into DB
  const { error: dbError } = await supabase.from("yearbook_entries").insert({
    farewell_id: farewellId,
    student_name: studentName,
    quote,
    section,
    photo_url: photoUrl,
    created_by: user.id,
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { error: "Failed to save yearbook entry" };
  }

  revalidatePath(`/dashboard/${farewellId}/yearbook`);
  return { success: true };
}

export async function deleteYearbookEntryAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("yearbook_entries")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete yearbook entry error:", error);
    return { error: "Failed to delete entry" };
  }

  revalidatePath(`/dashboard/${farewellId}/yearbook`);
  return { success: true };
}
