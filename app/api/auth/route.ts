import { NextRequest, NextResponse } from "next/server";

import {
  SignUpSchema,
  SignInSchema,
  MagicLinkSchema,
} from "@/utils/validators";

import {
  createUserWithPassword,
  signInWithPassword,
  sendMagicLink,
  revokeAllSessionsForUser,
  createSessionCookie,
} from "@/lib/auth/authServices";

import { handleApiError, ApiError } from "@/utils/errors";
import supabaseAdmin from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseAdmin;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    console.log("AUTH ACTION:", action);
    if (!action) throw new ApiError("missing_action", 400);

    const body = await req.json();
    const { email, password, username } = body;

    switch (action) {
      case "signup": {
        const {
          data: { user },
          error,
        } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: { username },
        });

        if (error) {
          console.error("createUserWithPassword error:", error);
          throw new ApiError("supabase_create_user_failed", 500, error.message);
        }

        return NextResponse.json({ ok: true, user });
      }

      case "signin": {
        const { session, user } = await signInWithPassword(email, password);

        // Issue application cookie-based session
        const jwtCookie = createSessionCookie(session);

        const res = NextResponse.json({
          ok: true,
          user,
          session,
        });

        if (jwtCookie) {
          res.cookies.set("app_session", jwtCookie, {
            httpOnly: true,
            sameSite: "strict",
            secure: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }

        return res;
      }

      case "magiclink": {
        const data = MagicLinkSchema.parse(body);
        await sendMagicLink(data.email);

        return NextResponse.json({
          ok: true,
          message: "Magic link sent",
        });
      }

      case "revoke-sessions": {
        const { userId } = body;
        if (!userId) throw new ApiError("missing_userId", 400);

        await revokeAllSessionsForUser(userId);

        return NextResponse.json({ ok: true });
      }

      default:
        throw new ApiError("unknown_action", 400);
    }
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    const handled = handleApiError(err);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
