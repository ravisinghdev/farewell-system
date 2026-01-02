import { getSettingsAction } from "@/app/actions/settings/actions";
import { GeneralSettingsForm } from "@/components/settings/forms/GeneralSettingsForm";
import { PageControlPanel } from "@/components/admin/page-control-panel";
import { createClient } from "@/utils/supabase/server";
import { PageSettingsMap } from "@/types/page-settings";

export default async function SettingsGeneralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  const supabase = await createClient();
  const { data: farewell } = await supabase
    .from("farewells")
    .select("page_settings")
    .eq("id", id)
    .single();

  const pageSettings = (farewell?.page_settings || {}) as PageSettingsMap;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">General Settings</h3>
      </div>
      <GeneralSettingsForm farewellId={id} initialSettings={settings.general} />

      <div className="h-px bg-white/10 my-8" />

      <PageControlPanel farewellId={id} initialSettings={pageSettings} />
    </div>
  );
}
