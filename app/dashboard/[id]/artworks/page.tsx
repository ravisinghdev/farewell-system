import { getArtworksAction } from "@/app/actions/artwork-actions";
import { ArtworkGrid } from "@/components/artworks/artwork-grid";
import { CreateArtworkDialog } from "@/components/artworks/create-artwork-dialog";
import { ConnectionsHeader } from "@/components/connections/connections-header";

interface ArtworksPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArtworksPage({ params }: ArtworksPageProps) {
  const { id } = await params;
  const artworks = await getArtworksAction(id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <ConnectionsHeader
            title="Art & Creative Works"
            description="A canvas of creativity and expression."
            farewellId={id}
          />
        </div>
        <div className="mt-2 md:mt-20">
          <CreateArtworkDialog farewellId={id} />
        </div>
      </div>

      <ArtworkGrid artworks={artworks} farewellId={id} />
    </div>
  );
}
