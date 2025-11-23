import { NextRequest, NextResponse } from "next/server";
import { generateTOTPForUser } from "@/actions/authActions";
import { createAdminSupabase } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  const admin = await createAdminSupabase();
  const body = await req.json().catch(() => ({}));
  const { user_id } = body;
  if (!user_id)
    return NextResponse.json({ error: "missing user_id" }, { status: 400 });

  const out = await generateTOTPForUser(user_id, "Farewell");
  return NextResponse.json(out);
}
