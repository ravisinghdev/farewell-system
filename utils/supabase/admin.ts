import { createClient } from "@supabase/supabase-js";

// Function to create a new admin client (useful if needed)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Export a singleton instance for backward compatibility
export const supabaseAdmin = createAdminClient();
