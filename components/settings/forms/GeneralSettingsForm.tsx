"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";
import {
  GeneralSettings,
  generalSettingsSchema,
  FarewellSettings,
} from "@/lib/settings/schema";
import { updateSettingsAction } from "@/app/actions/settings/actions";
import { toast } from "sonner";

interface GeneralSettingsFormProps {
  farewellId: string;
  initialSettings: GeneralSettings;
}

export function GeneralSettingsForm({
  farewellId,
  initialSettings,
}: GeneralSettingsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(data: GeneralSettings) {
    startTransition(() => {
      // Transition callback must be void, so we wrap the async call
      updateSettingsAction(
        farewellId,
        {
          general: data,
        } as Partial<FarewellSettings>,
        pathname
      )
        .then((result) => {
          if (result.success) {
            toast.success("Settings updated successfully");
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
          title="Farewell Identity"
          description="Basic information about your event."
        >
          <FormField
            control={form.control}
            name="farewell_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Farewell Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Farewell 2025"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  This name will be displayed on the dashboard and invitations.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="academic_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2024-2025"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={3}
                      placeholder="INR"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="event_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Event Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The main date of the farewell event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingCard>

        <SettingCard
          title="Maintenance & Status"
          description="Control the visibility and accessibility of your farewell."
          danger
        >
          <FormField
            control={form.control}
            name="is_maintenance_mode"
            render={({ field }) => (
              <SettingToggle
                title="Maintenance Mode"
                description="When enabled, only admins can access the farewell dashboard."
                checked={field.value!}
                onCheckedChange={field.onChange}
              />
            )}
          />
          {/* We could add Archive button here */}
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
