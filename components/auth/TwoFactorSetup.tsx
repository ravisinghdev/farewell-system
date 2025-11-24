"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type TOTPState = {
  secret?: string;
  qr?: string;
  token?: string;
  status?: "idle" | "generated" | "verified" | "error";
  error?: string;
};

export default function TwoFactorSetup({ userId }: { userId: string }) {
  const [state, setState] = useState<TOTPState>({ status: "idle" });

  async function generate() {
    setState({ status: "idle" });
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to generate");
      setState({ secret: json.secret, qr: json.qr, status: "generated" });
    } catch (err: any) {
      setState({ status: "error", error: err?.message || "Network error" });
    }
  }

  async function verify() {
    setState((s) => ({ ...s, status: "idle" }));
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", userId, token: state.token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Verification failed");
      setState((s) => ({ ...s, status: "verified" }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err?.message || "Network error",
      }));
    }
  }

  return (
    <div className="space-y-4">
      {state.status === "generated" && state.qr && (
        <div className="flex flex-col items-center gap-2">
          <img src={state.qr} alt="TOTP QR" className="w-48 h-48" />
          <p className="text-sm text-muted-foreground wrap-break-words">
            {state.secret}
          </p>
        </div>
      )}

      {state.status !== "generated" && (
        <div>
          <p className="text-sm text-muted-foreground">
            Set up two-factor authentication for your account.
          </p>
          <Button onClick={generate}>Generate TOTP</Button>
        </div>
      )}

      {state.status === "generated" && (
        <>
          <div>
            <Label htmlFor="token">Enter 6-digit code</Label>
            <Input
              id="token"
              value={state.token ?? ""}
              onChange={(e) =>
                setState((s) => ({ ...s, token: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={verify}>Verify & Enable</Button>
            <Button
              variant="ghost"
              onClick={() => setState({ status: "idle" })}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {state.status === "verified" && (
        <div className="text-sm text-green-600">2FA enabled successfully.</div>
      )}
      {state.status === "error" && (
        <div className="text-sm text-red-600">{state.error}</div>
      )}
    </div>
  );
}
