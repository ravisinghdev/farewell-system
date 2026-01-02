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
  FinanceSettings,
  financeSettingsSchema,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface PaymentMethodsFormProps {
  farewellId: string;
  initialSettings: FinanceSettings;
}

export function PaymentMethodsForm({
  farewellId,
  initialSettings,
}: PaymentMethodsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(financeSettingsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: FinanceSettings) {
    startTransition(() => {
      updateSettingsAction(farewellId, {
        finance: data,
      } as Partial<FarewellSettings>)
        .then((result) => {
          if (result.success) {
            toast.success("Payment methods updated");
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
          title="Payment Methods"
          description="Configure how students can contribute."
        >
          <FormField
            control={form.control}
            name="accepting_payments"
            render={({ field }) => (
              <SettingToggle
                title="Accept Contributions"
                description="Enable/disable the ability to contribute globally."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="allow_offline_payments"
            render={({ field }) => (
              <SettingToggle
                title="Cash / Offline Mode"
                description="Allow students to mark 'paid cash' for verification."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="upi_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID for Transfers</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. username@okhdfcbank"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  This UPI ID will be shown to students for direct transfers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

