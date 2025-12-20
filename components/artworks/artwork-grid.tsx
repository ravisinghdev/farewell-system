"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Palette } from "lucide-react";
import {
  deleteArtworkAction,
  getArtworksAction,
} from "@/app/actions/artwork-actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  total: number;
  farewellId: string;
}

export function ArtworkGrid({
  artworks: initialArtworks,
  total,
  farewellId,
}: ArtworkGridProps) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const LIMIT = 12;
  const hasMore = artworks.length < total;

  // Sync state when server revalidates
  // Sync state when server revalidates
  const [prevInitialArtworks, setPrevInitialArtworks] =
    useState(initialArtworks);
  const [artworkToDelete, setArtworkToDelete] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Filter out locally deleted items
  if (initialArtworks !== prevInitialArtworks) {
    setArtworks(initialArtworks.filter((a) => !deletedIds.has(a.id)));
    setPrevInitialArtworks(initialArtworks);
    setPage(1);
  }

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const { data: newArtworks } = await getArtworksAction(
        farewellId,
        nextPage,
        LIMIT
      );

      if (newArtworks?.length) {
        setArtworks((prev) => [
          ...prev,
          ...newArtworks.filter((a) => !deletedIds.has(a.id)),
        ]);
        setPage(nextPage);
      } else {
        toast.info("No more artworks to load");
      }
    } catch (error) {
      toast.error("Failed to load more artworks");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!artworkToDelete) return;

    const idToDelete = artworkToDelete;

    // Optimistic update
    setArtworks((prev) => prev.filter((a) => a.id !== idToDelete));
    setDeletedIds((prev) => new Set(prev).add(idToDelete));
    setArtworkToDelete(null);

    startTransition(async () => {
      const result = await deleteArtworkAction(idToDelete, farewellId);
      if (result.error) {
        toast.error(result.error);
        // Could revert here
      } else {
        toast.success("Artwork deleted");
      }
    });
  };

  if (artworks.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/20 animate-in fade-in zoom-in duration-500">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Palette className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No artworks yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
          Be the first to share your creative masterpiece.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {artworks.map((artwork, index) => (
            <motion.div
              key={artwork.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="break-inside-avoid"
              layout
            >
              <div className="relative group rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10">
                {/* Image Container */}
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={artwork.image_url}
                    alt={artwork.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <h3 className="font-bold text-white text-lg truncate translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-white/80 truncate translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100 mb-2">
                      by {artwork.artist_name || "Unknown"}
                    </p>
                    {artwork.description && (
                      <p className="text-xs text-white/60 line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
                        {artwork.description}
                      </p>
                    )}

                    <div className="absolute top-4 right-4 translate-y-[-10px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 bg-black/40 text-white hover:bg-red-500/80 hover:text-white rounded-full backdrop-blur-md border border-white/10"
                        onClick={(e) => {
                          e.preventDefault();
                          setArtworkToDelete(artwork.id);
                        }}
                        disabled={isPending}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
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
            Load More Artworks
          </Button>
        </div>
      )}
      <AlertDialog
        open={!!artworkToDelete}
        onOpenChange={() => setArtworkToDelete(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this artwork?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently remove this
              artwork from the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setArtworkToDelete(null)}
              className="bg-transparent border-white/10 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
