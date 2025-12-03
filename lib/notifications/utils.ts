import { createClient } from "@/utils/supabase/server";

export type NotificationType =
  | "message"
  | "mention"
  | "system"
  | "request"
  | "finance"
  | "duty";

interface SendNotificationParams {
  userId: string;
  farewellId?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Sends a notification to a user.
 * This creates a database record and triggers a push notification (if configured).
 */
export async function sendNotification({
  userId,
  farewellId,
  title,
  message,
  type,
  link,
  metadata = {},
}: SendNotificationParams) {
  const supabase = await createClient();

  // 1. Create database notification
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      farewell_id: farewellId,
      title,
      message,
      type,
      link,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return { error: error.message };
  }

  // 2. Send push notification (fire and forget)
  // We don't await this to keep the response fast
  sendPushNotification(userId, {
    title,
    body: message,
    data: { url: link, ...metadata },
  }).catch((err) => console.error("Error sending push:", err));

  return { data: notification };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends a push notification to all of a user's registered devices.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
) {
  const supabase = await createClient();

  // 1. Get user's push tokens
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("token, platform")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return; // No tokens found or error
  }

  // 2. Send to each token
  // TODO: Integrate with a real push provider like FCM, OneSignal, or Expo
  // For now, we'll just log it as a simulation
  console.log(
    `[PUSH] Sending to ${subscriptions.length} devices for user ${userId}:`,
    payload
  );

  // Example implementation structure for future:
  /*
  const tokens = subscriptions.map(s => s.token);
  await fcm.sendMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
  });
  */
}
