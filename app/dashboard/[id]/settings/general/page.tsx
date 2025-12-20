import { getSettingsAction } from "@/app/actions/settings/actions";
import { GeneralSettingsForm } from "@/components/settings/forms/GeneralSettingsForm";

export default async function SettingsGeneralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">General Settings</h3>
      </div>
      <GeneralSettingsForm farewellId={id} initialSettings={settings.general} />
    </div>
  );
}
