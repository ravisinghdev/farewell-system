import { getSettingsAction } from "@/app/actions/settings/actions";
import { FinanceSettingsForm } from "@/components/settings/forms/FinanceSettingsForm";

export default async function SettingsFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Finance & Contributions</h3>
      </div>
      <FinanceSettingsForm farewellId={id} initialSettings={settings.finance} />
    </div>
  );
}
