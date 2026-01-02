"use client";

import { useState } from "react";
import { updatePageSettingsAction } from "@/app/actions/farewell-admin-actions";
import { PAGE_KEYS, PageSettingsMap } from "@/types/page-settings";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PageControlPanelProps {
  farewellId: string;
  initialSettings: PageSettingsMap;
}

export function PageControlPanel({
  farewellId,
  initialSettings,
}: PageControlPanelProps) {
  const [settings, setSettings] = useState<PageSettingsMap>(
    initialSettings || {}
  );
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async (key: string, newConfig: any) => {
    setLoading(key);
    // Optimistic update
    setSettings((prev) => ({
      ...prev,
      [key]: newConfig,
    }));

    const result = await updatePageSettingsAction(farewellId, key, newConfig);

    if (result.error) {
      toast.error(result.error);
      // Revert on error
      setSettings((prev) => ({
        ...prev,
        [key]: initialSettings[key] || {
          enabled: true,
          reason: "maintenance",
          message: "",
        },
      }));
    } else {
      toast.success(`${key} settings updated`);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Page Access Control</h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable specific pages for all users.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {PAGE_KEYS.map((key) => {
          const config = settings[key] || {
            enabled: true,
            reason: "maintenance",
            message: "",
          };

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between min-w-[150px]">
                <span className="capitalize font-medium">{key}</span>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) =>
                    handleUpdate(key, { ...config, enabled: checked })
                  }
                  disabled={!!loading}
                />
              </div>

              {!config.enabled && (
                <div className="flex-1 flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2">
                  <Select
                    value={config.reason}
                    onValueChange={(val: any) =>
                      handleUpdate(key, { ...config, reason: val })
                    }
                    disabled={!!loading}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Custom message (optional)"
                    value={config.message || ""}
                    onChange={(e) => {
                      // Local state only for text input to avoid spamming server
                      const val = e.target.value;
                      setSettings((prev) => ({
                        ...prev,
                        [key]: { ...config, message: val },
                      }));
                    }}
                    onBlur={(e) =>
                      handleUpdate(key, { ...config, message: e.target.value })
                    }
                    disabled={!!loading}
                    className="flex-1"
                  />
                </div>
              )}
              {loading === key && (
                <Loader2 className="h-4 w-4 animate-spin self-center" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
