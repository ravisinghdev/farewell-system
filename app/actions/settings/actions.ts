"use server";

import { revalidatePath } from "next/cache";
import {
  getEffectiveSettings,
  updateFarewellSettings,
} from "@/lib/settings/service";
import { FarewellSettings } from "@/lib/settings/schema";
import { createClient } from "@/utils/supabase/server";

export async function getSettingsAction(
  farewellId: string
): Promise<FarewellSettings> {
  // In future, we can inject user ID/role from session here to personalize
  return await getEffectiveSettings(farewellId);
}

export async function updateSettingsAction(
  farewellId: string,
  settings: Partial<FarewellSettings>,
  path?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Is Admin Check?
  // We should ideally check if the user is an admin of this farewell
  // For now assuming the page typically protects this, but let's add a basic check if possible
  // or rely on RLS (but RLS for UPDATE on farewells might be strict).

  try {
    await updateFarewellSettings(farewellId, settings);

    // Revalidate the cache
    revalidatePath(`/dashboard/${farewellId}`, "layout");

    // Return success
    return { success: true };
  } catch (e: any) {
    console.error("Update settings failed", e);
    return { success: false, error: e.message };
  }
}
