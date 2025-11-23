import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing Supabase admin keys.");
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
