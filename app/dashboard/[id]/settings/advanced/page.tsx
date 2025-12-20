import { getSettingsAction } from "@/app/actions/settings/actions";
import { AdvancedSettingsForm } from "@/components/settings/forms/AdvancedSettingsForm";

export default async function SettingsAdvancedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Advanced Configuration</h3>
      </div>
      <AdvancedSettingsForm
        farewellId={id}
        initialSettings={settings.features}
      />
    </div>
  );
}
