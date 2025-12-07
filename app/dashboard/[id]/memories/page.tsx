import { getAlbumsAction } from "@/app/actions/gallery-actions";
import { AlbumGrid } from "@/components/gallery/album-grid";
import { CreateAlbumDialog } from "@/components/gallery/create-album-dialog";
import { ConnectionsHeader } from "@/components/connections/connections-header";

interface MemoriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemoriesPage({ params }: MemoriesPageProps) {
  const { id } = await params;
  const albums = await getAlbumsAction(id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <ConnectionsHeader
            title="Memories Gallery"
            description="Timeless moments captured forever."
            farewellId={id}
          />
        </div>
        <div className="mt-2 md:mt-20">
          <CreateAlbumDialog farewellId={id} />
        </div>
      </div>

      <AlbumGrid albums={albums} farewellId={id} />
    </div>
  );
}
