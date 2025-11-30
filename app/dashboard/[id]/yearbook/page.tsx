import { getYearbookEntriesAction } from "@/app/actions/yearbook-actions";
import { YearbookGrid } from "@/components/yearbook/yearbook-grid";
import { CreateYearbookEntryDialog } from "@/components/yearbook/create-yearbook-entry-dialog";
import { Separator } from "@/components/ui/separator";

interface YearbookPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function YearbookPage({ params }: YearbookPageProps) {
  const { id } = await params;
  const entries = await getYearbookEntriesAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Digital Yearbook
          </h2>
          <p className="text-muted-foreground">
            A collection of profiles, quotes, and memories.
          </p>
        </div>
        <CreateYearbookEntryDialog farewellId={id} />
      </div>
      <Separator />
      <YearbookGrid entries={entries} farewellId={id} />
    </div>
  );
}
