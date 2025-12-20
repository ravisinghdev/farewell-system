"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
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
  JoiningSettings,
  joiningSettingsSchema,
  JoinMethod,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface JoiningSettingsFormProps {
  farewellId: string;
  initialSettings: JoiningSettings;
}

export function JoiningSettingsForm({
  farewellId,
  initialSettings,
}: JoiningSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(joiningSettingsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: JoiningSettings) {
    startTransition(() => {
      updateSettingsAction(farewellId, {
        joining: data,
      } as Partial<FarewellSettings>)
        .then((result) => {
          if (result.success) {
            toast.success("Joining settings updated");
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
          title="Access Control"
          description="How users join this farewell."
        >
          <FormField
            control={form.control}
            name="join_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joining Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={JoinMethod.APPROVAL}>
                      Admin Approval (Secure)
                    </SelectItem>
                    <SelectItem value={JoinMethod.INVITE_CODE}>
                      Invite Code
                    </SelectItem>
                    <SelectItem value={JoinMethod.AUTO}>
                      Automatic (Open)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("join_method") === JoinMethod.INVITE_CODE && (
            <FormField
              control={form.control}
              name="invite_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FAREWELL2025"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Share this code with students.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="joining_locked"
            render={({ field }) => (
              <SettingToggle
                title="Lock Joining"
                description="Prevent any new members from joining."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingCard>

        <SettingCard title="Guests & Outsiders">
          <FormField
            control={form.control}
            name="allow_guests"
            render={({ field }) => (
              <SettingToggle
                title="Allow Guests"
                description="Allow non-student accounts (requires different role flow)."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Joining Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
