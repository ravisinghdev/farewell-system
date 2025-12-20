import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    ANON_KEY_PREFIX: process.env.SUPABASE_ANON_KEY?.slice(0, 12) || null,
    SERVICE_KEY_PREFIX:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) || null,
    SERVICE_ROLE_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
