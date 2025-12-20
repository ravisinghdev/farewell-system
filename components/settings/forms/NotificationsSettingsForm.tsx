"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSettingsAction } from "@/app/actions/settings/actions";
import { toast } from "sonner";
import {
  FarewellSettings,
  NotificationsSettings,
  notificationsSettingsSchema,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface NotificationsSettingsFormProps {
  farewellId: string;
  initialSettings: NotificationsSettings;
}

export function NotificationsSettingsForm({
  farewellId,
  initialSettings,
}: NotificationsSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(notificationsSettingsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: NotificationsSettings) {
    startTransition(() => {
      updateSettingsAction(farewellId, {
        notifications: data,
      } as Partial<FarewellSettings>)
        .then((result) => {
          if (result.success) {
            toast.success("Notification preferences updated");
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
        <SettingCard
          title="Channels"
          description="How should users receive updates?"
        >
          <FormField
            control={form.control}
            name="enable_email_notifications"
            render={({ field }) => (
              <SettingToggle
                title="Email Notifications"
                description="Send updates via email."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="enable_push_notifications"
            render={({ field }) => (
              <SettingToggle
                title="Push Notifications"
                description="Send mobile push alerts."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="enable_whatsapp_notifications"
            render={({ field }) => (
              <SettingToggle
                title="WhatsApp Integration"
                description="Enable experimental WhatsApp alerts."
                checked={!!field.value}
                onCheckedChange={field.onChange}
                disabled={true} // Placeholder for now
              />
            )}
          />
        </SettingCard>

        <SettingCard
          title="Digest Frequency"
          description="Control automated summary emails."
        >
          <FormField
            control={form.control}
            name="admin_digest_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Digest</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="student_digest_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Digest</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Update</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Notification Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
