"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Play, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { getVideosAction } from "@/app/actions/legacy-actions";

export function VideosList({
  initialVideos,
  farewellId,
}: {
  initialVideos: any[];
  farewellId: string;
}) {
  const [videos, setVideos] = useState(initialVideos);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  useEffect(() => {
    const channel = supabase
      .channel("legacy_videos_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legacy_videos",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          const newData = await getVideosAction(farewellId);
          setVideos(newData);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, farewellId, router]);

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Film className="h-12 w-12 mb-4 opacity-20" />
        <p>No videos uploaded yet. Be the first to add one!</p>
      </div>
    );
  }

  const mainVideo = videos.find((v) => v.is_main) || videos[0];
  const otherVideos = videos.filter((v) => v.id !== mainVideo.id);

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      {/* Main Video */}
      <div className="w-full max-w-3xl aspect-video bg-black rounded-xl flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl">
        {mainVideo.thumbnail_url ? (
          <img
            src={mainVideo.thumbnail_url}
            alt={mainVideo.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        )}
        <a
          href={mainVideo.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform z-10"
        >
          <Play className="h-8 w-8 text-white fill-white ml-1" />
        </a>
        <div className="absolute bottom-6 left-6 text-white z-10">
          <h3 className="text-2xl font-bold">{mainVideo.title}</h3>
          <p className="text-white/80">{mainVideo.description}</p>
        </div>
      </div>

      {/* Other Videos */}
      {otherVideos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {otherVideos.map((video) => (
            <div
              key={video.id}
              className="aspect-video bg-muted rounded-lg relative group cursor-pointer overflow-hidden"
            >
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors"
              >
                <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
