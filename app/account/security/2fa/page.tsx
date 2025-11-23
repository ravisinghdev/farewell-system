"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TwoFAPage() {
  const supabase = createClient();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function init() {
    // server action endpoint generates secret and returns QR dataURL
    const res = await fetch("/api/auth/generate-totp", { method: "POST" });
    const data = await res.json();
    if (data?.qrDataUrl) {
      setQr(data.qrDataUrl);
      setSecret(data.secret);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/auth/verify-totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: code }),
    });
    const data = await res.json();
    if (data?.ok) setStatus("2FA enabled");
    else setStatus("Invalid code");
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Two-factor authentication</h2>

      {qr ? (
        <div className="mb-4">
          <img src={qr} alt="totp qr" className="mx-auto rounded-md border" />
          <p className="text-sm text-neutral-400 mt-2">
            Scan with Google Authenticator / Authy
          </p>
        </div>
      ) : (
        <div>Preparing QR…</div>
      )}

      <form onSubmit={verify} className="space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6-digit code"
          className="input"
        />
        <button className="btn" type="submit">
          Verify & enable
        </button>
      </form>

      {status && <div className="mt-3 text-sm">{status}</div>}
    </div>
  );
}
