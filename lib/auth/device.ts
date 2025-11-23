import crypto from "crypto";

export function generateDeviceFingerprint(ip: string, userAgent: string) {
  const raw = `${ip}:${userAgent}:${Date.now()}:${Math.random()}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}
