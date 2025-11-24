import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { ApiError, handleApiError } from "@/utils/errors";
import { authenticator } from "otplib";
import qrcode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, token } = body;

    if (!userId) throw new ApiError("missing_userId", 400);

    if (!supabaseAdmin) throw new ApiError("service_key_missing", 500);

    switch (action) {
      /* -------------------------------------------------------
       * Generate secret + QR code
       * -----------------------------------------------------*/
      case "generate": {
        const secret = authenticator.generateSecret();
        const label = `FarewellApp:${userId}`;

        const otpauth = authenticator.keyuri(label, "FarewellApp", secret);
        const qr = await qrcode.toDataURL(otpauth);

        await supabaseAdmin.from("totp_secrets").upsert({
          user_id: userId,
          secret_text: secret,
          enabled: false,
        });

        return NextResponse.json({
          ok: true,
          secret,
          qr,
        });
      }

      /* -------------------------------------------------------
       * Verify TOTP
       * -----------------------------------------------------*/
      case "verify": {
        if (!token) throw new ApiError("missing_token", 400);

        const { data, error } = await supabaseAdmin
          .from("totp_secrets")
          .select("secret_text, enabled")
          .eq("user_id", userId)
          .single();

        if (error || !data) throw new ApiError("totp_not_initialized", 400);

        const isValid = authenticator.check(token, data.secret_text);
        if (!isValid) throw new ApiError("invalid_totp", 401);

        await supabaseAdmin
          .from("totp_secrets")
          .update({ enabled: true })
          .eq("user_id", userId);

        return NextResponse.json({ ok: true, verified: true });
      }

      default:
        throw new ApiError("unknown_action", 400);
    }
  } catch (err) {
    const handled = handleApiError(err);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
