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
import { updateSettingsAction } from "@/app/actions/settings/actions";
import { toast } from "sonner";
import {
  FarewellSettings,
  DutySettings,
  dutySettingsSchema,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface DutiesSettingsFormProps {
  farewellId: string;
  initialSettings: DutySettings;
}

export function DutiesSettingsForm({
  farewellId,
  initialSettings,
}: DutiesSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(dutySettingsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: DutySettings) {
    startTransition(() => {
      updateSettingsAction(farewellId, {
        duties: data,
      } as Partial<FarewellSettings>)
        .then((result) => {
          if (result.success) {
            toast.success("Duty protocols updated");
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
          title="Duty System Control"
          description="Manage how tasks are assigned and tracked."
        >
          <FormField
            control={form.control}
            name="enable_duties"
            render={({ field }) => (
              <SettingToggle
                title="Enable Duty System"
                description="Turn off if you don't need task management."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="admin_only_creation"
            render={({ field }) => (
              <SettingToggle
                title="Admin-Only Creation"
                description="If disabled, teachers (or others with permission) can create duties."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingCard>

        <SettingCard
          title="Limits & Receipts"
          description="Enforce rules on assignments and expenses."
        >
          <FormField
            control={form.control}
            name="max_active_duties_per_user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Active Duties Per Student</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Prevents overloading a single student.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="require_receipt_proof"
            render={({ field }) => (
              <SettingToggle
                title="Require Proof for Expenses"
                description="Mandatory file upload for reimbursement requests."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="auto_approve_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auto-Approve Limit (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Expenses below this amount are automatically approved. Set 0
                  to disable.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Duty Protocols
          </Button>
        </div>
      </form>
    </Form>
  );
}
