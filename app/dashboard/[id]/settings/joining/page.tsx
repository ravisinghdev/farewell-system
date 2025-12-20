import { getSettingsAction } from "@/app/actions/settings/actions";
import { JoiningSettingsForm } from "@/components/settings/forms/JoiningSettingsForm";

export default async function SettingsJoiningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Joining & Membership</h3>
      </div>
      <JoiningSettingsForm farewellId={id} initialSettings={settings.joining} />
    </div>
  );
}
