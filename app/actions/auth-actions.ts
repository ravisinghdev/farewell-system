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

// Sign Up Action

export async function signupAction(form: SignupInput) {
  const parsed = signupSchema.safeParse(form);

  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, username, password } = parsed.data;

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

    const {
      data: { user, session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          full_name: fullName,
          username,
          role: defaultRole,
        },
      },
    });

    if (error) return { error: error.message };

    if (user && !session) {
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

// Login Action

export async function loginAction(form: LoginInput) {
  const parsed = loginSchema.safeParse(form);

  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const { ip } = await getClientInfo();

  if (rateLimitLogin(ip, email)) {
    return { error: "Too many attempts. Try again shortly." };
  }

  let destinationUrl = "/welcome";

  try {
    const supabase = await createClient();

    // Step 1: password login
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    if (!user) {
      return { error: "Login failed (no user after signin)" };
    }

    // TODO: MFA required method implantation

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
  return { success: true, redirectUrl: destinationUrl };
}
