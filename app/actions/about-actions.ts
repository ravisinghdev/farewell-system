"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

export async function getAboutSectionsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("about_sections")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("order_index", { ascending: true });

  if (error) return [];
  return data;
}

export async function upsertAboutSectionAction(
  farewellId: string,
  data: {
    id?: string;
    title: string;
    content: string;
    image_url?: string;
    order_index: number;
  }
): Promise<ActionState> {
  const supabase = await createClient();

  const payload: any = {
    farewell_id: farewellId,
    title: data.title,
    content: data.content,
    order_index: data.order_index,
    updated_at: new Date().toISOString(),
  };
  if (data.image_url !== undefined) payload.image_url = data.image_url;
  if (data.id) payload.id = data.id;

  const { error } = await supabase.from("about_sections").upsert(payload);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/about`);
  return { success: true };
}

export async function deleteAboutSectionAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("about_sections").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/about`);
  return { success: true };
}
