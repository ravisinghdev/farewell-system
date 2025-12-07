import { getYearbookEntriesAction } from "@/app/actions/yearbook-actions";
import { YearbookGrid } from "@/components/yearbook/yearbook-grid";
import { CreateYearbookEntryDialog } from "@/components/yearbook/create-yearbook-entry-dialog";
import { ConnectionsHeader } from "@/components/connections/connections-header";

interface YearbookPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function YearbookPage({ params }: YearbookPageProps) {
  const { id } = await params;
  const entries = await getYearbookEntriesAction(id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <ConnectionsHeader
            title="Digital Yearbook"
            description="Signatures, quotes, and final words."
            farewellId={id}
          />
        </div>
        <div className="mt-2 md:mt-20">
          <CreateYearbookEntryDialog farewellId={id} />
        </div>
      </div>

      <YearbookGrid entries={entries} farewellId={id} />
    </div>
  );
}
