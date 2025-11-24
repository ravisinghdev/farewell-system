import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const { email, user_agent, ip_address, event_type } = body;

  // Try to link to user id if email exists
  let userId: string | null = null;
  if (email) {
    const { data: users } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("metadata->>email", email)
      .limit(1)
      .maybeSingle();
    if (users?.id) userId = users.id;
  }

  await supabaseAdmin.from("login_activity").insert({
    user_id: userId,
    event_type: event_type ?? "failed_login",
    user_agent,
    ip_address,
  });

  return NextResponse.json({ ok: true });
}
