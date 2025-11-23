import { NextRequest, NextResponse } from "next/server";
import { verifyTOTPForUser } from "@/actions/authActions";

export async function POST(req: NextRequest) {
  const { user_id, token } = await req.json().catch(() => ({}));
  if (!user_id || !token)
    return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });

  const ok = await verifyTOTPForUser(user_id, token);
  return NextResponse.json({ ok });
}
