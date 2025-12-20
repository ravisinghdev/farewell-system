"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SettingToggleProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SettingToggle({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  loading,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-1">
        <Label className={cn("text-base", disabled && "opacity-50")}>
          {title}
        </Label>
        {description && (
          <span
            className={cn(
              "text-sm text-muted-foreground",
              disabled && "opacity-50"
            )}
          >
            {description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled || loading}
        />
      </div>
    </div>
  );
}
