import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

export const createClient = () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

let clientInstance: SupabaseClient | null = null;

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    if (!clientInstance) {
      clientInstance = createClient();
    }
    return (clientInstance as any)[prop];
  },
});

export default supabaseClient;
