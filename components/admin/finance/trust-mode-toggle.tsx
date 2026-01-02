"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updatePaymentConfigAction } from "@/app/actions/finance-actions";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ShieldCheck, Info } from "lucide-react";

interface TrustModeToggleProps {
  farewellId: string;
  initialAutoVerify: boolean;
}

export function TrustModeToggle({
  farewellId,
  initialAutoVerify,
}: TrustModeToggleProps) {
  const [enabled, setEnabled] = useState(initialAutoVerify);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setIsLoading(true);

    try {
      const result = await updatePaymentConfigAction(farewellId, {
        auto_verify: checked,
      });
      if (result.success) {
        toast.success(
          checked
            ? "Trust Mode Enabled: Payments will be auto-verified"
            : "Trust Mode Disabled: Manual verification required"
        );
      }
    } catch (error) {
      toast.error("Failed to update settings");
      setEnabled(!checked); // Revert
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Trust Mode (Auto-Verify)
          </CardTitle>
          <CardDescription className="text-xs">
            Skip manual verification for new contributions.
          </CardDescription>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="data-[state=checked]:bg-emerald-600"
        />
      </CardHeader>
      {enabled && (
        <CardContent className="pt-0">
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50">
            <Info className="w-3 h-3 mt-0.5" />
            <p>
              Users' payments will be marked as "Verified" immediately upon
              submission. Use this only if you trust your contributors.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
