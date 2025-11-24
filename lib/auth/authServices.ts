import { supabaseClient } from "@/utils/supabase/client";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { ApiError } from "@/utils/errors";
import type { Session, User } from "@supabase/supabase-js";
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

// Create user with email + password (Admin)
export async function createUserWithPassword(
  email: string,
  password: string,
  username?: string
) {
  if (!supabaseAdmin) throw new ApiError("service_key_missing", 500);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { username },
  });

  if (error) {
    console.error("createUserWithPassword error:", error);
    throw new ApiError("supabase_create_user_failed", 500, error.message);
  }

  return data.user;
}

// Sign in with email + password
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new ApiError("invalid_credentials", 401);

  return data as { user: User | null; session: Session | null };
}

/* -------------------------------------------------------
 * Magic link
 * -----------------------------------------------------*/
export async function sendMagicLink(email: string) {
  const redirectTo = process.env.MAGICLINK_REDIRECT_URL;
  if (!redirectTo) throw new ApiError("magiclink_redirect_missing", 500);

  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) throw new ApiError("magiclink_failed", 500, error.message);

  return data;
}

/* -------------------------------------------------------
 * Revoke all sessions (custom implementation)
 * Supabase v2 removed admin.invalidateUserRefreshTokens()
 * -----------------------------------------------------*/
export async function revokeAllSessionsForUser(userId: string) {
  if (!supabaseAdmin) throw new ApiError("service_key_missing", 500);

  await supabaseAdmin
    .from("devices")
    .update({ revoked: true })
    .eq("user_id", userId);

  return true;
}

/* -------------------------------------------------------
 * Get user by ID (Admin)
 * -----------------------------------------------------*/
export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw new ApiError("user_fetch_failed", 500, error.message);
  return data.user;
}

/* -------------------------------------------------------
 * Sign App JWT
 * -----------------------------------------------------*/
// Declare allowed JWT expiry patterns
type JwtExpiry = `${number}${"s" | "m" | "h" | "d"}`;

export function signAppJwt(
  payload: Record<string, any>,
  expiresIn: JwtExpiry | number = "15m"
) {
  if (!JWT_SECRET) throw new ApiError("jwt_secret_missing", 500);

  const options: SignOptions = {
    expiresIn: expiresIn as any, // safely cast, still type-checked by your JwtExpiry definition
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/* -------------------------------------------------------
 * Verify App JWT
 * -----------------------------------------------------*/
export function verifyAppJwt(token: string) {
  try {
    if (!JWT_SECRET) throw new ApiError("jwt_secret_missing", 500);
    return jwt.verify(token, JWT_SECRET);
  } catch (err: any) {
    throw new ApiError("invalid_jwt", 401, err.message);
  }
}

/* -------------------------------------------------------
 * Convert Supabase Session → Cookie JWT
 * -----------------------------------------------------*/
export function createSessionCookie(session: Session | null) {
  if (!session?.user) return null;

  return signAppJwt({ sub: session.user.id }, "7d" as JwtExpiry);
}

/* -------------------------------------------------------
 * Parse Bearer tokens
 * -----------------------------------------------------*/
export function parseBearer(value?: string | null) {
  if (!value) return null;
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : value;
}

/* -------------------------------------------------------
 * Verify Supabase Access Token
 * -----------------------------------------------------*/
export async function verifySupabaseAccessToken(accessToken?: string | null) {
  if (!accessToken) throw new ApiError("missing_access_token", 401);

  const client = await createServerClient();

  const { data, error } = await client.auth.getUser();

  if (error) throw new ApiError("invalid_supabase_token", 401, error.message);

  return data.user;
}

/* -------------------------------------------------------
 * Server sign-out
 * -----------------------------------------------------*/
export async function signOutUser(accessToken?: string | null) {
  try {
    if (!accessToken) return true;

    const client = await createServerClient();
    await client.auth.signOut();

    return true;
  } catch (err) {
    console.warn("signOutUser:", err);
    return false;
  }
}
