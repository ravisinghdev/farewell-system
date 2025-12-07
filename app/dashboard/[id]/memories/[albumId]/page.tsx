import { getAlbumMediaAction } from "@/app/actions/gallery-actions";
import { MediaGrid } from "@/components/gallery/media-grid";
import { UploadMediaDialog } from "@/components/gallery/upload-media-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

interface AlbumPageProps {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id, albumId } = await params;
  const media = await getAlbumMediaAction(albumId);
  const supabase = await createClient();

  // Fetch album details for the title
  const { data: album } = await supabase
    .from("albums")
    .select("name")
    .eq("id", albumId)
    .single();

  if (!album) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/${id}/memories`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{album.name}</h2>
          <p className="text-muted-foreground">
            {media.length} {media.length === 1 ? "item" : "items"}
          </p>
        </div>
        <UploadMediaDialog farewellId={id} albumId={albumId} />
      </div>
      <Separator />
      <MediaGrid media={media} albumId={albumId} farewellId={id} />
    </div>
  );
}
