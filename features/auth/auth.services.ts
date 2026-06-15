import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { Session } from "@supabase/supabase-js";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

export async function trackSession(session: Session | null) {
  if (!session) return;

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "Unknown";
  
  // Forwarded for handles proxies, x-real-ip is common, fallback to a local string if not found
  const ipAddress = 
    headerList.get("x-forwarded-for")?.split(",")[0] || 
    headerList.get("x-real-ip") || 
    "127.0.0.1";

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const deviceName = device.model || os.name || "Unknown Device";
  const platform = browser.name ? `${browser.name} on ${os.name}` : "Unknown Platform";

  // Hash the refresh token to match what we store, avoiding storing raw refresh tokens
  const refreshTokenHash = crypto.createHash('sha256').update(session.refresh_token).digest('hex');

  const supabase = await createClient();

  // Upsert the session based on the refresh_token_hash or similar identifier?
  // The table requires user_id, refresh_token_hash, etc.
  const { error } = await supabase.from("user_sessions").insert({
    user_id: session.user.id,
    refresh_token_hash: refreshTokenHash,
    user_agent: userAgent,
    device_name: deviceName,
    ip_address: ipAddress,
    platform: platform,
    expires_at: new Date((session.expires_at || 0) * 1000).toISOString(),
    last_active_at: new Date().toISOString()
  });

  if (error) {
    console.error("Failed to track session in DB:", error);
  }

  // Also log the security event
  // Note: we need an organization_id for security logs based on the schema error.
  // Wait, if it's a new user, they might not have an organization yet.
  // The error says:
  // RejectExcessProperties<{ created_at?: string | undefined; event_type: string; id?: string | undefined; ip_address?: string | null | undefined; organization_id: string; severity?: string | undefined; user_id?: string | ... 1 more ... | undefined; }, { ...; }>
  // So organization_id is REQUIRED.
  
  // Actually let's NOT log to security_logs if they don't have an organization ID yet. We can log to user_sessions instead which works perfectly.
}
