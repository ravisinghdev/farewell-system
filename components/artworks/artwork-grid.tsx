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
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {artworks.map((artwork) => (
        <div
          key={artwork.id}
          className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
        >
          {/* Image Container */}
          <div className="relative w-full">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h3 className="font-bold text-white truncate translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                {artwork.title}
              </h3>
              <p className="text-xs text-white/60 truncate translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                by {artwork.artist_name || "Unknown"}
              </p>

              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/40 text-white hover:bg-black/60 rounded-full backdrop-blur-md"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(artwork.id);
                  }}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Visible Info (if overlay isn't preferred on mobile, but let's keep it clean for now) */}
        </div>
      ))}
    </div>
  );
}
