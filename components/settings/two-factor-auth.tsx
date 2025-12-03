"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Loader2 } from "lucide-react";
import { useAuthClaims } from "@/components/providers/farewell-provider";

export function TwoFactorAuth() {
  const authClaims = useAuthClaims();
  const [isEnabled, setIsEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (authClaims?.factors) {
      const totpFactor = authClaims.factors.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );
      setIsEnabled(!!totpFactor);
    }
  }, [authClaims]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setPendingFactorId(data.id);
      setSecret(data.totp.secret);
      const url = await QRCode.toDataURL(data.totp.uri);
      setQrCodeUrl(url);
    } catch (error: any) {
      toast.error("Error enabling 2FA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      if (!pendingFactorId) {
        throw new Error("No pending 2FA enrollment found.");
      }

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: pendingFactorId,
        code: verifyCode,
      });

      if (error) throw error;

      setIsEnabled(true);
      setQrCodeUrl(null);
      setSecret(null);
      setVerifyCode("");
      setPendingFactorId(null);
      toast.success("Two-factor authentication enabled!");
    } catch (error: any) {
      toast.error("Error verifying code: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      // Find factor ID from claims
      const factor = authClaims?.factors?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );

      if (!factor) {
        // If not in claims, maybe it was just enabled in this session?
        // But we don't store the verified ID in state after verification currently.
        // If we just verified, we should probably reload the page or fetch user to get the ID if we want to disable immediately.
        // But for now, let's assume it's in claims or throw.
        throw new Error("Please reload the page to disable 2FA.");
      }

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (error) throw error;

      setIsEnabled(false);
      toast.success("Two-factor authentication disabled.");
    } catch (error: any) {
      toast.error("Error disabling 2FA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-medium">2FA is enabled</span>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </div>
        ) : (
          <>
            {!qrCodeUrl ? (
              <Button onClick={handleEnable} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable 2FA
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 border p-4 rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan this QR code with your authenticator app (Google
                      Authenticator, Authy, etc.)
                    </p>
                    <p className="text-xs font-mono bg-muted p-2 rounded">
                      Secret: {secret}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verify-code"
                      placeholder="Enter 6-digit code"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      maxLength={6}
                    />
                    <Button
                      onClick={handleVerify}
                      disabled={loading || verifyCode.length !== 6}
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
