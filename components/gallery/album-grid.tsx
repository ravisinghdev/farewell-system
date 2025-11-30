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
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => (
        <Link
          key={album.id}
          href={`/dashboard/${farewellId}/memories/${album.id}`}
          className="block group"
        >
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <Folder className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="line-clamp-1">{album.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Created by {album.created_by_user?.full_name || "Unknown"}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
