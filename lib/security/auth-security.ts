import crypto from "crypto";
import { headers } from "next/headers";

// Rate Limiting

type BucketKey = string;
type Bucket = { count: number; windowStart: number };

const BUCKETS = new Map<BucketKey, Bucket>();
const WINDOW = 60_000;
const LOGIN_LIMIT = 10;
const SIGNUP_LIMIT = 5;

function limit(key: BucketKey, max: number): boolean {
  const now = Date.now();
  const current = BUCKETS.get(key);

  if (!current) {
    BUCKETS.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - current.windowStart > WINDOW) {
    BUCKETS.set(key, { count: 1, windowStart: now });
    return false;
  }

  current.count++;
  return current.count > max;
}

export function rateLimitLogin(ip: string, email: string) {
  return limit(`login:${ip}:${email}`, LOGIN_LIMIT);
}

export function rateLimitSignup(ip: string) {
  return limit(`signup:${ip}`, SIGNUP_LIMIT);
}

// Extracting the user IP Address

export async function getClientInfo() {
  const h = await headers();

  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const userAgent = h.get("user-agent") || "unknown";

  return { ip, userAgent };
}

// Blocklist methods

const BLOCKED_EMAILS = ["test@example.com"];
const BLOCKED_DOMAINS = ["tempmail.com", "mailinator.com"];

export function isBlockedEmail(email: string): boolean {
  const lower = email.toLowerCase();

  if (BLOCKED_EMAILS.includes(lower)) return true;

  const domain = lower.split("@")[1];
  return BLOCKED_DOMAINS.includes(domain);
}

// Taking the device fingerprint

export function createDeviceFingerprint(ip: string, agent: string) {
  return crypto.createHash("sha256").update(`${ip}::${agent}`).digest("hex");
}
