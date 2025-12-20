import { getSettingsAction } from "@/app/actions/settings/actions";
import { RolesSettingsForm } from "@/components/settings/forms/RolesSettingsForm";

export default async function SettingsRolesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Role Configuration</h3>
      </div>
      <RolesSettingsForm farewellId={id} initialRoles={settings.roles} />
    </div>
  );
}
