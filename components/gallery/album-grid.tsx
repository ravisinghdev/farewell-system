"use client";

import Link from "next/link";
import { Folder } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Album {
  id: string;
  name: string;
  created_at: string | null;
  created_by_user: { full_name: string | null } | null; // Joined data
}

interface AlbumGridProps {
  albums: Album[];
  farewellId: string;
}

import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

export function AlbumGrid({ albums, farewellId }: AlbumGridProps) {
  useRealtimeSubscription({
    table: "albums",
    filter: `farewell_id=eq.${farewellId}`,
  });
  if (albums.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
        <Folder className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No albums yet</h3>
        <p className="text-muted-foreground">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {albums.map((album) => (
        <Link
          key={album.id}
          href={`/dashboard/${farewellId}/memories/${album.id}`}
          className="block group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-full bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:-rotate-1 backdrop-blur-md relative z-10 overflow-hidden">
            {/* Decorative Folder Tab */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-2xl group-hover:bg-purple-500/20 transition-colors" />

            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <Folder className="w-6 h-6" />
              </div>
              {/* Count placeholder if we had it */}
            </div>

            <h3 className="font-bold text-lg text-white mb-1 group-hover:translate-x-1 transition-transform">
              {album.name}
            </h3>
            <p className="text-xs text-white/40">
              by {album.created_by_user?.full_name || "Unknown"}
            </p>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </div>
        </Link>
      ))}
    </div>
  );
}
