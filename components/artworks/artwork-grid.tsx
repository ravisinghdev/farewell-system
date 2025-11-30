"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteArtworkAction } from "@/app/actions/artwork-actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  artist_name: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface ArtworkGridProps {
  artworks: Artwork[];
  farewellId: string;
}

export function ArtworkGrid({ artworks, farewellId }: ArtworkGridProps) {
  useRealtimeSubscription({
    table: "artworks",
    filter: `farewell_id=eq.${farewellId}`,
  });

  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteArtworkAction(id, farewellId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Artwork deleted");
      }
    });
  };

  if (artworks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20 border-dashed">
        No artworks yet. Be the first to submit!
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {artworks.map((artwork) => (
        <Card key={artwork.id} className="overflow-hidden group">
          <div className="relative aspect-[4/3]">
            <Image
              src={artwork.image_url}
              alt={artwork.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold truncate">{artwork.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              by {artwork.artist_name || "Unknown"}
            </p>
            {artwork.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {artwork.description}
              </p>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end">
            {/* In a real app, we'd check permissions here. 
                 For now, we'll rely on the server action to enforce RLS/permissions 
                 but ideally we hide the button if not allowed. */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(artwork.id)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
