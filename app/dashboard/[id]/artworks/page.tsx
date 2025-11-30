import { getArtworksAction } from "@/app/actions/artwork-actions";
import { ArtworkGrid } from "@/components/artworks/artwork-grid";
import { CreateArtworkDialog } from "@/components/artworks/create-artwork-dialog";
import { Separator } from "@/components/ui/separator";

interface ArtworksPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArtworksPage({ params }: ArtworksPageProps) {
  const { id } = await params;
  const artworks = await getArtworksAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Art & Creative Works
          </h2>
          <p className="text-muted-foreground">
            Showcase of drawings, paintings, and digital art.
          </p>
        </div>
        <CreateArtworkDialog farewellId={id} />
      </div>
      <Separator />
      <ArtworkGrid artworks={artworks} farewellId={id} />
    </div>
  );
}
