"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, Loader2, Plus } from "lucide-react";
import { getAlbumsAction } from "@/app/actions/gallery-actions";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Album {
  id: string;
  name: string;
  created_at: string | null;
  created_by_user: { full_name: string | null } | null;
}

interface AlbumGridProps {
  albums: Album[];
  total: number;
  farewellId: string;
}

export function AlbumGrid({
  albums: initialAlbums,
  total,
  farewellId,
}: AlbumGridProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const LIMIT = 12;

  // Sync state when server revalidates (e.g. after creation)
  const [prevInitialAlbums, setPrevInitialAlbums] = useState(initialAlbums);
  if (initialAlbums !== prevInitialAlbums) {
    setAlbums(initialAlbums);
    setPrevInitialAlbums(initialAlbums);
    setPage(1);
  }

  const hasMore = albums.length < total;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const { data: newAlbums } = await getAlbumsAction(
        farewellId,
        nextPage,
        LIMIT
      );

      if (newAlbums?.length) {
        setAlbums((prev) => [...prev, ...newAlbums]);
        setPage(nextPage);
      } else {
        toast.info("No more albums to load");
      }
    } catch (error) {
      toast.error("Failed to load more albums");
    } finally {
      setLoading(false);
    }
  };

  if (albums.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/20 animate-in fade-in zoom-in duration-500">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Folder className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No memories yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
          Start capturing moments by creating the first album.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {albums.map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
            >
              <Link
                href={`/dashboard/${farewellId}/memories/${album.id}`}
                className="block group relative h-full"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="h-full bg-card/40 hover:bg-card/60 border border-border/50 hover:border-primary/30 p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 backdrop-blur-md relative z-10 overflow-hidden flex flex-col justify-between group-hover:-translate-y-1">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-10 -translate-y-10 blur-3xl group-hover:bg-primary/10 transition-colors" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 mb-6 shadow-sm group-hover:shadow-lg group-hover:shadow-primary/30">
                      <Folder className="w-6 h-6" />
                    </div>

                    <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {album.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      by{" "}
                      <span className="font-medium text-foreground/80">
                        {album.created_by_user?.full_name || "Unknown"}
                      </span>
                    </p>
                    <div className="w-8 h-8 rounded-full border border-border/10 flex items-center justify-center bg-background/50 text-muted-foreground opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full px-8 h-12 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary transition-all duration-300 group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            )}
            Load More Memories
          </Button>
        </div>
      )}
    </div>
  );
}
