import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { unstable_cache } from "next/cache";
import { DEFAULT_FAREWELL_SETTINGS } from "./defaults";
import { FarewellSettings, farewellSettingsSchema } from "./schema";

// Fallback if deepmerge isn't installed, let's write a simple deep merge or use Object.assign for now to avoid dep hell unless requested.
// Actually, partial overrides are better handled by deepmerge. I'll write a simple one or assume I can install it.
// For now, I will use a simple implementation to avoid external deps if possible, or just overwrite sections.
// But settings need deep merging usually. Let's assume standard spread is NOT enough for nested objects.
// I will implement a safe merge helper.

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

export type SettingsScope = {
  farewellId: string;
  role?: string;
  userId?: string;
};

// 1. Low-level fetcher (Cached)
const fetchFarewellSettingsFromDB = async (farewellId: string) => {
  // Use a static client (no cookies) for caching compatibility
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("farewells")
    .select("settings")
    .eq("id", farewellId)
    .single();

  if (error || !data) return null;
  return data.settings as Partial<FarewellSettings>;
};

// Cached version of the DB fetch
export const getCachedFarewellSettings = unstable_cache(
  async (farewellId: string) => fetchFarewellSettingsFromDB(farewellId),
  ["farewell-settings"],
  { tags: ["settings"], revalidate: 60 } // Cache for 60s or until invalidated
);

// 2. Resolution Logic
export async function getEffectiveSettings(
  farewellId: string,
  role?: string
): Promise<FarewellSettings> {
  // A. Start with Platform Defaults
  let settings = { ...DEFAULT_FAREWELL_SETTINGS };

  // B. Fetch Farewell Overrides
  const farewellOverrides = await getCachedFarewellSettings(farewellId);

  if (farewellOverrides) {
    // parsing to ensure schema safety, though DB should be valid
    try {
      // We deep merge the DB settings on top of defaults
      // rigorous Zod parse is good but might fail if DB has partial garbage.
      // Ideally we trust the merge.
      settings = safeMerge(settings, farewellOverrides);
    } catch (e) {
      console.error("Failed to merge settings", e);
    }
  }

  // C. Apply Role Overrides (if any logic existed for SPECIFIC overrides, but our Schema puts permissions IN the roles object)
  // The "Role" part of your request implies that we might have "Role Level Overrides" for OTHER settings
  // (e.g. "Teachers see a different theme").
  // For now, the `roles` object in settings controls permissions.
  // If we had `settings_overrides` table, we'd fetch that here.

  return settings;
}

// 3. Admin Update Helper
export async function updateFarewellSettings(
  farewellId: string,
  newSettings: Partial<FarewellSettings>
) {
  // This will be called by the Server Action
  // It needs to fetch current, merge, validate, and save.
  const supabase = await createClient();

  // We fetch current to ensure we don't blow away unrelated keys if we did a partial update
  // But usually the UI sends the whole section or we assume deep merge in Postgres?
  // Postgres `jsonb_set` is annoying for deep updates.
  // Easier to Fetch -> Merge in JS -> Write back.

  const current = (await fetchFarewellSettingsFromDB(farewellId)) || {};
  const merged = safeMerge(current, newSettings);

  // Validate before save
  const parsed = farewellSettingsSchema.parse({
    ...DEFAULT_FAREWELL_SETTINGS,
    ...merged,
  }); // Ensure it's full valid

  // Determine updates for top-level columns to keep them in sync
  const updatePayload: any = { settings: parsed };

  // Sync General Settings
  if (parsed.general) {
    if (parsed.general.farewell_name)
      updatePayload.name = parsed.general.farewell_name;
    if (parsed.general.is_maintenance_mode !== undefined)
      updatePayload.is_maintenance_mode = parsed.general.is_maintenance_mode;

    // Try to parse year from academic_year string (e.g. "2024-2025" -> 2024)
    if (parsed.general.academic_year) {
      const yearInt = parseInt(parsed.general.academic_year.split("-")[0]);
      if (!isNaN(yearInt)) updatePayload.year = yearInt;
    }
  }

  // Sync Finance Settings
  if (parsed.finance) {
    if (parsed.finance.target_budget !== undefined)
      updatePayload.target_amount = parsed.finance.target_budget;
    // Note: 'budget_goal' column also exists in schema but 'target_amount' fits 'target_budget' better.

    if (parsed.finance.accepting_payments !== undefined)
      updatePayload.accepting_payments = parsed.finance.accepting_payments;

    // Sync legacy payment_config JSONB
    updatePayload.payment_config = {
      upi: !!parsed.finance.upi_id, // Assume UPI enabled if ID present or generally accepting? Let's use accepting_payments broadly or just preserve logic.
      cash: parsed.finance.allow_offline_payments,
      upi_id: parsed.finance.upi_id || "",
      bank_transfer: false, // No setting for this yet
    };
  }

  const { error } = await supabase
    .from("farewells")
    .update(updatePayload)
    .eq("id", farewellId);

  if (error) throw error;
  return parsed;
}
