import { getAlbumsAction } from "@/app/actions/gallery-actions";
import { AlbumGrid } from "@/components/gallery/album-grid";
import { CreateAlbumDialog } from "@/components/gallery/create-album-dialog";
import { Separator } from "@/components/ui/separator";

interface MemoriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemoriesPage({ params }: MemoriesPageProps) {
  const { id } = await params;
  const albums = await getAlbumsAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Memories</h2>
          <p className="text-muted-foreground">
            Photo and video albums from the farewell.
          </p>
        </div>
        <CreateAlbumDialog farewellId={id} />
      </div>
      <Separator />
      <AlbumGrid albums={albums} farewellId={id} />
    </div>
  );
}
