import { getSettingsAction } from "@/app/actions/settings/actions";
import { CommunicationSettingsForm } from "@/components/settings/forms/CommunicationSettingsForm";

export default async function SettingsCommunicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Communication</h3>
      </div>
      <CommunicationSettingsForm
        farewellId={id}
        initialSettings={settings.communication}
      />
    </div>
  );
}
