"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { updateSettingsAction } from "@/app/actions/settings/actions";
import { toast } from "sonner";
import {
  FarewellSettings,
  FeatureFlags,
  featureFlagsSchema,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface AdvancedSettingsFormProps {
  farewellId: string;
  initialSettings: FeatureFlags;
}

export function AdvancedSettingsForm({
  farewellId,
  initialSettings,
}: AdvancedSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(featureFlagsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: FeatureFlags) {
    startTransition(async () => {
      try {
        const result = await updateSettingsAction(farewellId, {
          features: data,
        } as Partial<FarewellSettings>);

        if (result.success) {
          toast.success("Advanced settings updated");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update settings");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SettingCard
          title="Experimental Features"
          description="Enable powerful matching and AI tools."
        >
          <FormField
            control={form.control}
            name="enable_ai_moderation"
            render={({ field }) => (
              <SettingToggle
                title="AI Content Moderation"
                description="Automatically flag inappropriate messages."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="enable_ocr_receipts"
            render={({ field }) => (
              <SettingToggle
                title="OCR for Receipts"
                description="Extract amounts automatically from uploaded images."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingCard>

        <SettingCard title="Danger Zone" danger>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Archive Farewell</h4>
              <p className="text-sm text-muted-foreground">
                Make this farewell read-only.
              </p>
            </div>
            <Button variant="destructive" disabled>
              Archive (Coming Soon)
            </Button>
          </div>
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Advanced Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
