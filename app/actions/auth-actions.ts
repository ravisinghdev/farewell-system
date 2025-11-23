"use server";

import { createClient } from "@/utils/supabase/server";
import {
  loginSchema,
  signupSchema,
  LoginInput,
  SignupInput,
} from "@/lib/schemas/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  rateLimitLogin,
  rateLimitSignup,
  isBlockedEmail,
  getClientInfo,
} from "@/lib/security/auth-security";

import { UserRole } from "@/lib/auth/roles";
import { getPostLoginDestination } from "@/lib/farewell/post-login";

/* ---------------------------------------------------------------------- */
/* SIGNUP                                                                 */
/* ---------------------------------------------------------------------- */

export async function signupAction(form: SignupInput) {
  const parsed = signupSchema.safeParse(form);

  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, username, password } = parsed.data;

  const { ip } = await getClientInfo();

  if (rateLimitSignup(ip)) {
    return { error: "Too many signup attempts. Try again later." };
  }

  if (isBlockedEmail(email)) {
    return { error: "Email/domain not allowed." };
  }

  const defaultRole: UserRole = "student";

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          username,
          role: defaultRole,
        },
      },
    });

    if (error) return { error: error.message };

    if (data.user && !data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Signup error:", err);
    return { error: "Internal server error" };
  }
}

/* ---------------------------------------------------------------------- */
/* LOGIN                                                                  */
/* ---------------------------------------------------------------------- */

export async function loginAction(form: LoginInput) {
  const parsed = loginSchema.safeParse(form);

  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, rememberMe } = parsed.data;
  const { ip } = await getClientInfo();

  if (rateLimitLogin(ip, email)) {
    return { error: "Too many attempts. Try again shortly." };
  }

  let destinationUrl = "/welcome";

  try {
    const supabase = await createClient();

    // Step 1: password login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    // If you're enforcing 2FA, call your TOTP check here and return { mfaRequired: true } as before

    const { data: userResp, error: userError } = await supabase.auth.getUser();
    if (userError || !userResp.user) {
      return { error: "Login failed (no user after signin)" };
    }

    const user = userResp.user;
    const destination = await getPostLoginDestination(user.id);

    switch (destination.kind) {
      case "dashboard":
        destinationUrl = `/dashboard/${destination.farewellId}`;
        break;
      case "pending-approval":
        destinationUrl = "/pending-approval";
        break;
      case "welcome":
      default:
        destinationUrl = "/welcome";
        break;
    }
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Internal server error" };
  }

  revalidatePath("/", "layout");
  redirect(destinationUrl);
}
