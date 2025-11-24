// app/api/auth/devices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/utils/errors";
import { registerDevice, listDevicesForUser } from "@/lib/auth/devices";
import { generateDeviceFingerprint } from "@/lib/auth/device";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-auth-user-id");
    if (!userId) throw new ApiError("unauthenticated", 401);

    const devices = await listDevicesForUser(userId);
    return NextResponse.json({ ok: true, devices });
  } catch (err) {
    const handled = handleApiError(err);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-auth-user-id");
    if (!userId) throw new ApiError("unauthenticated", 401);

    const body = await req.json();
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const fingerprint = generateDeviceFingerprint(ip, userAgent);

    const device = await registerDevice(userId, fingerprint, {
      userAgent,
      ip,
      ...body.meta,
    });

    return NextResponse.json({ ok: true, device });
  } catch (err) {
    const handled = handleApiError(err);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
