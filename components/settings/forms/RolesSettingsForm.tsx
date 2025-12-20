"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { updateSettingsAction } from "@/app/actions/settings/actions";
import { toast } from "sonner";
import {
  FarewellSettings,
  RolePermissions,
  rolePermissionsSchema,
} from "@/lib/settings/schema";
import { SettingCard } from "@/components/settings/ui/SettingCard";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";

interface RolesSettingsFormProps {
  farewellId: string;
  initialRoles: RolePermissions;
}

export function RolesSettingsForm({
  farewellId,
  initialRoles,
}: RolesSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        roles: rolePermissionsSchema,
      })
    ),
    // Correct way: we are validating the whole object which is a record
    // But react-hook-form expects a flat object usually or nested.
    // Let's simplified schema usage:
    defaultValues: { roles: initialRoles },
  });

  // We need to iterate over roles. For now, we hardcode known roles or dynamic keys?
  // Schema defines it as record string -> object.
  // Let's assume standard roles: admin, teacher, student unless custom.
  const roleKeys = Object.keys(initialRoles);

  function onSubmit(data: { roles: RolePermissions }) {
    startTransition(async () => {
      try {
        const result = await updateSettingsAction(farewellId, {
          roles: data.roles,
        } as Partial<FarewellSettings>);

        if (result.success) {
          toast.success("Permissions updated successfully");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update permissions");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {roleKeys.map((role) => (
          <SettingCard
            key={role}
            title={`${
              role.charAt(0).toUpperCase() + role.slice(1)
            } Permissions`}
            description={`Configure what ${role}s can do in this farewell.`}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name={`roles.${role}.can_create_duties`}
                render={({ field }) => (
                  <SettingToggle
                    title="Create Duties"
                    description="Allow creating new duties/tasks."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FormField
                control={form.control}
                name={`roles.${role}.can_post_announcements`}
                render={({ field }) => (
                  <SettingToggle
                    title="Post Announcements"
                    description="Allow posting to the main feed."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FormField
                control={form.control}
                name={`roles.${role}.can_invite_users`}
                render={({ field }) => (
                  <SettingToggle
                    title="Invite Users"
                    description="Allow generating invite links."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FormField
                control={form.control}
                name={`roles.${role}.can_manage_finance`}
                render={({ field }) => (
                  <SettingToggle
                    title="Manage Finance"
                    description="View ledger and approve payments."
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={role === "student"} // Hard safety
                  />
                )}
              />
            </div>
          </SettingCard>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions
          </Button>
        </div>
      </form>
    </Form>
  );
}
