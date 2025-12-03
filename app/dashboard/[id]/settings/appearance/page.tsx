"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useSettings } from "@/components/settings/settings-provider";
import { useProfile } from "@/components/profile-provider";
import { updateSettings } from "@/app/actions/settings-actions";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark"]),
  font_size: z.enum(["small", "medium", "large"]).optional(),
  reduced_motion: z.boolean().optional(),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
function AppearanceForm() {
  const { setTheme, theme: currentTheme } = useTheme();
  const { settings, updateSettings: updateContextSettings } = useSettings();
  const { user } = useProfile();
  const userId = user?.id;

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: (settings?.theme as "light" | "dark") || "light",
      font_size:
        (settings?.font_size as "small" | "medium" | "large") || "medium",
      reduced_motion: settings?.reduced_motion || false,
    },
    values: {
      theme: (settings?.theme as "light" | "dark") || "light",
      font_size:
        (settings?.font_size as "small" | "medium" | "large") || "medium",
      reduced_motion: settings?.reduced_motion || false,
    },
  });

  async function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme);
    if (userId) {
      try {
        await updateSettings(userId, {
          theme: data.theme,
          font_size: data.font_size,
          reduced_motion: data.reduced_motion,
        });
        toast.success("Appearance updated");
      } catch (e) {
        toast.error("Failed to save appearance preference");
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Theme</FormLabel>
              <FormDescription>
                Select the theme for the dashboard.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                className="grid max-w-md grid-cols-2 gap-8 pt-2"
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="light" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Light
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="dark" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Dark
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="font_size"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Font Size</FormLabel>
              <FormDescription>
                Adjust the font size of the dashboard.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                className="grid max-w-md grid-cols-3 gap-4 pt-2"
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="small" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-2 hover:border-accent text-center">
                      <span className="text-sm">Aa</span>
                    </div>
                    <span className="block w-full p-2 text-center font-normal text-xs">
                      Small
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="medium" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-2 hover:border-accent text-center">
                      <span className="text-base">Aa</span>
                    </div>
                    <span className="block w-full p-2 text-center font-normal text-sm">
                      Medium
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="large" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-2 hover:border-accent text-center">
                      <span className="text-lg">Aa</span>
                    </div>
                    <span className="block w-full p-2 text-center font-normal text-base">
                      Large
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reduced_motion"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Reduced Motion</FormLabel>
                <FormDescription>
                  Reduce the amount of animation and movement in the interface.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit">Update preferences</Button>
      </form>
    </Form>
  );
}

export default function SettingsAppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the app. Automatically switch between day
          and night themes.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
}
