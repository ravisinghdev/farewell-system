import { getSettingsAction } from "@/app/actions/settings/actions";
import { PaymentMethodsForm } from "@/components/contributions/payment-methods-form";
import { ContributionHeader } from "@/components/contributions/contribution-header";

export default async function ManageMethodsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettingsAction(id);

  return (
    <div className="w-full h-full p-4 md:p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <ContributionHeader
        title="Manage Payment Methods"
        description="Configure how you want to receive contributions."
        farewellId={id}
      />

      <div className="mt-8">
        <PaymentMethodsForm
          farewellId={id}
          initialSettings={settings.finance}
        />
      </div>

      <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-border">
        <p>
          <strong>Note:</strong> Changes here will immediately affect what
          options are available to students on the contribution page.
        </p>
      </div>
    </div>
  );
}
