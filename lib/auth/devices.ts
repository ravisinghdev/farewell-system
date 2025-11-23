// lib/auth/devices.ts

import { supabaseAdmin } from "@/utils/supabase/admin";
import { ApiError } from "@/utils/errors";

export async function registerDevice(
  userId: string,
  fingerprint: string,
  meta: any
) {
  if (!supabaseAdmin) throw new ApiError("service_key_missing", 500);

  const { data, error } = await supabaseAdmin
    .from("devices")
    .insert({
      user_id: userId,
      fingerprint,
      meta,
      revoked: false,
    })
    .select()
    .single();

  if (error) throw new ApiError("device_register_failed", 500, error.message);
  return data;
}

export async function updateDeviceLastSeen(deviceId: string) {
  const { data, error } = await supabaseAdmin
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", deviceId)
    .select()
    .single();

  if (error) throw new ApiError("device_update_failed", 500, error.message);
  return data;
}

export async function listDevicesForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("devices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new ApiError("device_list_failed", 500, error.message);
  return data;
}

export async function revokeDevice(deviceId: string) {
  const { data, error } = await supabaseAdmin
    .from("devices")
    .update({ revoked: true })
    .eq("id", deviceId)
    .select()
    .single();

  if (error) throw new ApiError("device_revoke_failed", 500, error.message);
  return data;
}
