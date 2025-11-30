"use client";

import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface Media {
  id: string;
  url: string;
  type: string;
  created_at: string | null;
}

interface MediaGridProps {
  media: Media[];
  albumId: string; // Need albumId for filter
}

export function MediaGrid({ media, albumId }: MediaGridProps) {
  useRealtimeSubscription({
    table: "gallery_media",
    filter: `album_id=eq.${albumId}`,
  });
  if (media.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No photos or videos yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {media.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
        >
          {item.type === "video" ? (
            <div className="w-full h-full flex items-center justify-center bg-black/10">
              {/* Ideally we'd use a video player or thumbnail here. 
                   For now, just a placeholder or the video tag. */}
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={item.url}
                alt="Gallery item"
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
