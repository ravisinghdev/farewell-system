import { getSettingsAction } from "@/app/actions/settings/actions";
import { NotificationsSettingsForm } from "@/components/settings/forms/NotificationsSettingsForm";

export default async function SettingsNotificationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Notifications</h3>
      </div>
      <NotificationsSettingsForm
        farewellId={id}
        initialSettings={settings.notifications}
      />
    </div>
  );
}
