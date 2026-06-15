"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function revokeSessionAction(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Update the user_sessions table
  const { error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  // Check if the session we are revoking is the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    const currentHash = crypto.createHash('sha256').update(session.refresh_token).digest('hex');
    const { data: dbSession } = await supabase
      .from("user_sessions")
      .select("refresh_token_hash")
      .eq("id", sessionId)
      .single();

    if (dbSession && dbSession.refresh_token_hash === currentHash) {
      // User revoked their currently active session
      await supabase.auth.signOut();
      return redirect("/login");
    }
  }

  revalidatePath("/settings/sessions");
}
