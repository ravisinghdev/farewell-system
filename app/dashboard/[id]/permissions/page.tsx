import { getSettingsAction } from "@/app/actions/settings/actions";
import { RolesSettingsForm } from "@/components/settings/forms/RolesSettingsForm";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="flex flex-col h-full space-y-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Access & Roles</h2>
          <p className="text-muted-foreground">
            Manage granular permissions for different user roles.
          </p>
        </div>
        <Shield className="w-8 h-8 text-muted-foreground/20" />
      </div>

      <div className="max-w-4xl">
        {/* We reuse the existing Roles Form component */}
        <RolesSettingsForm
          farewellId={id}
          initialRoles={settings.roles || {}}
        />
      </div>
    </div>
  );
}
