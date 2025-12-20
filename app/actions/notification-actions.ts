"use server";

import { createClient } from "@/utils/supabase/server";

export async function createNotificationAction(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    link,
  });
  if (error) console.error("Error sending notification:", error);
}

export async function getNotificationsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient();
  await supabase.rpc("mark_notification_read", { notification_id: id });
}
