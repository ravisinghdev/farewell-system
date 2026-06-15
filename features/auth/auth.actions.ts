"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas";
import { trackSession } from "./auth.services";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, payload: { email, password } };
  }

  const supabase = await createClient();
  
  const { error, data } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message, payload: { email, password } };
  }

  await trackSession(data.session);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const parsed = signupSchema.safeParse({ email, password, fullName });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, payload: { email, password, fullName } };
  }

  const supabase = await createClient();
  
  const headerList = await headers();
  const origin = headerList.get("origin") || "";
  
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
      }
    },
  });

  if (error) {
    return { error: error.message, payload: { email, password, fullName } };
  }
  
  if (data.session) {
    await trackSession(data.session);
  }

  if (!data.session) {
    return { success: "Check your email to verify your account." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, payload: { email } };
  }

  const supabase = await createClient();
  
  const headerList = await headers();
  const origin = headerList.get("origin") || "";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { error: error.message, payload: { email } };
  }

  return { success: "Check your email for the password reset link." };
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
