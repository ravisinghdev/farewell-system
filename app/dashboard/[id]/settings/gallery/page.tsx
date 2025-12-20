import { getSettingsAction } from "@/app/actions/settings/actions";
import { GallerySettingsForm } from "@/components/settings/forms/GallerySettingsForm";

export default async function SettingsGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gallery & Media</h3>
      </div>
      <GallerySettingsForm
        farewellId={id}
        initialSettings={settings.features}
      />
    </div>
  );
}
