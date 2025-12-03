"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export interface Notification {
  id: string;
  user_id: string;
  farewell_id?: string;
  title: string;
  message: string;
  type:
    | "message"
    | "mention"
    | "system"
    | "request"
    | "finance"
    | "duty"
    | "success"
    | "error"
    | "warning"
    | "chat"
    | "announcement";
  link?: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export async function getNotificationsAction(limit = 20, offset = 0) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return [];
  const userId = claimsData.claims.sub;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data as Notification[];
}

export async function getUnreadCountAction() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return 0;
  const userId = claimsData.claims.sub;

  const adminClient = createAdminClient();
  const { count, error } = await adminClient
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

export async function markAsReadAction(notificationId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Unauthorized" };
  const userId = claimsData.claims.sub;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllAsReadAction() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Unauthorized" };
  const userId = claimsData.claims.sub;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function registerPushTokenAction(
  token: string,
  platform: "web" | "android" | "ios"
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData || !claimsData.claims) return { error: "Unauthorized" };
  const userId = claimsData.claims.sub;

  const adminClient = createAdminClient();
  // Upsert the token
  const { error } = await adminClient.from("push_subscriptions").upsert(
    {
      user_id: userId,
      token,
      platform,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id, token" }
  );

  if (error) {
    console.error("Error registering push token:", error);
    return { error: error.message };
  }

  return { success: true };
}
