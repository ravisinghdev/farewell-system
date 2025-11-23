import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/utils/errors";
import { revokeDevice } from "@/lib/auth/devices";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-auth-user-id");
    if (!userId) throw new ApiError("unauthenticated", 401);

    const { deviceId } = await req.json();
    if (!deviceId) throw new ApiError("missing_deviceId", 400);

    await revokeDevice(deviceId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const handled = handleApiError(err);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
