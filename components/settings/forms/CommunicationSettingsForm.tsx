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
  CommunicationSettings,
  communicationSettingsSchema,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface CommunicationSettingsFormProps {
  farewellId: string;
  initialSettings: CommunicationSettings;
}

export function CommunicationSettingsForm({
  farewellId,
  initialSettings,
}: CommunicationSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(communicationSettingsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: CommunicationSettings) {
    startTransition(() => {
      updateSettingsAction(farewellId, {
        communication: data,
      } as Partial<FarewellSettings>)
        .then((result) => {
          if (result.success) {
            toast.success("Communication settings updated");
            router.refresh();
          } else {
            toast.error(result.error || "Failed to update settings");
          }
        })
        .catch(() => {
          toast.error("An unexpected error occurred");
        });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SettingCard title="Chat & DMs" description="Manage social features.">
          <FormField
            control={form.control}
            name="enable_chat"
            render={({ field }) => (
              <SettingToggle
                title="Enable Group Chat"
                description="Allow all members to chat in the main channel."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="enable_reactions"
            render={({ field }) => (
              <SettingToggle
                title="Message Reactions"
                description="Allow emojis and reactions on messages."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="allow_media_in_chat"
            render={({ field }) => (
              <SettingToggle
                title="Allow Media Uploads"
                description="Users can send images/videos in chat."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingCard>

        <SettingCard title="Announcements" description="Broadcast controls.">
          <FormField
            control={form.control}
            name="enable_announcements"
            render={({ field }) => (
              <SettingToggle
                title="Enable Announcements"
                description="Show the announcement board."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="admin_only_announcements"
            render={({ field }) => (
              <SettingToggle
                title="Admin-Only Posting"
                description="Only admins can create announcements."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Communication Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
