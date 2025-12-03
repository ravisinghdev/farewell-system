import { Separator } from "@/components/ui/separator";
import { PayoutMethods } from "@/components/settings/payout-methods";

export default function PaymentsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payments & Payouts</h3>
        <p className="text-sm text-muted-foreground">
          Manage your payment methods for receiving reimbursements.
        </p>
      </div>
      <Separator />
      <PayoutMethods />
    </div>
  );
}
