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
  FinanceSettings,
  financeSettingsSchema,
  PaymentSplitMode,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface FinanceSettingsFormProps {
  farewellId: string;
  initialSettings: FinanceSettings;
}

export function FinanceSettingsForm({
  farewellId,
  initialSettings,
}: FinanceSettingsFormProps) {
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
            toast.success("Finance settings updated");
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
          title="Budget & Targets"
          description="Set your financial goals."
        >
          <FormField
            control={form.control}
            name="target_budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Farewell Budget</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  The estimated total cost of the event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="split_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution Model</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a split mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PaymentSplitMode.EQUAL}>
                      Equal Split (All pay same)
                    </SelectItem>
                    <SelectItem value={PaymentSplitMode.WEIGHTED}>
                      Weighted (Based on role)
                    </SelectItem>
                    <SelectItem value={PaymentSplitMode.CUSTOM}>
                      Voluntary / Custom
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How should the cost be divided among students?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingCard>

        <SettingCard
          title="Payment collection"
          description="Configure how you accept money."
        >
          <FormField
            control={form.control}
            name="accepting_payments"
            render={({ field }) => (
              <SettingToggle
                title="Accept Payments"
                description="Enable or disable new contributions globally."
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
                title="Allow Cash / Offline"
                description="Students can mark 'paid cash' for admin approval."
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="allow_partial_payments"
            render={({ field }) => (
              <SettingToggle
                title="Partial Payments"
                description="Allow paying in installments."
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
                <FormLabel>UPI ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="username@okhdfcbank"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Shown to students for direct transfers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Finance Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
