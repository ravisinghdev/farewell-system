import { getContributionsAction } from "@/app/actions/contribution-actions";
import { AddContributionDialog } from "@/components/contributions/add-contribution-dialog";
import { ContributionList } from "@/components/contributions/contribution-list";
import { Separator } from "@/components/ui/separator";

interface ContributionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContributionsPage({
  params,
}: ContributionsPageProps) {
  const { id } = await params;
  const contributions = await getContributionsAction(id);

  const totalAmount = contributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Contributions</h2>
          <p className="text-muted-foreground">
            Manage your payments and view history.
          </p>
        </div>
        <AddContributionDialog farewellId={id} />
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Contributed
          </div>
          <div className="text-2xl font-bold">₹{totalAmount}</div>
        </div>
      </div>

      <ContributionList contributions={contributions} />
    </div>
  );
}
