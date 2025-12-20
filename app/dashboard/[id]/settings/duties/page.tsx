import { getSettingsAction } from "@/app/actions/settings/actions";
import { DutiesSettingsForm } from "@/components/settings/forms/DutiesSettingsForm";

export default async function SettingsDutiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Duties & Protocol</h3>
      </div>
      <DutiesSettingsForm farewellId={id} initialSettings={settings.duties} />
    </div>
  );
}
