"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { PlayCircle, Trash2, X, Maximize2, Download } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { deleteMediaAction } from "@/app/actions/gallery-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CustomVideoPlayer } from "@/components/ui/video-player";
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

interface Media {
  id: string;
  url: string;
  type: string;
  created_at: string | null;
}

interface MediaGridProps {
  media: Media[];
  albumId: string;
  farewellId: string;
}

export function MediaGrid({
  media: initialMedia,
  albumId,
  farewellId,
}: MediaGridProps) {
  // useRealtimeSubscription({
  //   table: "gallery_media",
  //   filter: `album_id=eq.${albumId}`,
  // });

  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [isPending, startTransition] = useTransition();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);

  // Track deleted IDs locally to filter out stale data from server revalidations
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Sync props to state if they change (e.g. revalidation),
  // but ensure we don't bring back items we just deleted.
  const [prevInitialMedia, setPrevInitialMedia] = useState(initialMedia);
  if (initialMedia !== prevInitialMedia) {
    setMedia(initialMedia.filter((item) => !deletedIds.has(item.id)));
    setPrevInitialMedia(initialMedia);
  }

  const confirmDelete = () => {
    if (!mediaToDelete) return;

    // Optimistically update UI
    setMedia((prev) => prev.filter((m) => m.id !== mediaToDelete));

    const idToDelete = mediaToDelete;
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(idToDelete);
      return next;
    });

    setMediaToDelete(null); // Close dialog immediately

    startTransition(async () => {
      const res = await deleteMediaAction(idToDelete, farewellId, albumId);
      if (res.error) {
        toast.error(res.error);
        // Rollback if needed, but for now we assume success
      } else {
        toast.success("Memory deleted");
      }
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation();
    setMediaToDelete(mediaId);
  };

  const downloadMedia = async (
    e: React.MouseEvent,
    url: string,
    type: string
  ) => {
    e.stopPropagation();
    try {
      toast.loading("Starting download...");
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `media-${Date.now()}.${type === "video" ? "mp4" : "png"}`;
      document.body.appendChild(a);
      a.click(); // Trigger download
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl); // Cleanup
      toast.dismiss();
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.dismiss();
      toast.error("Failed to download media");
    }
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20 border-dashed">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Image
            src="/placeholder.svg"
            alt="Placeholder"
            width={32}
            height={32}
            className="opacity-20 unoptimized"
          />
        </div>
        <h3 className="text-lg font-medium">No photos or videos yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload moments to this album.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-xl overflow-hidden bg-black/5 border border-white/10 cursor-pointer hover:border-white/20 transition-all duration-300"
            onClick={() => setSelectedMedia(item)}
          >
            {item.type === "video" ? (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                <video
                  src={item.url}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={item.url}
                  alt="Gallery item"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-start justify-end p-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-lg"
                onClick={(e) => handleDeleteClick(e, item.id)}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!mediaToDelete}
        onOpenChange={() => setMediaToDelete(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete this
              media from the album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setMediaToDelete(null)}
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

      <Dialog
        open={!!selectedMedia}
        onOpenChange={(open) => !open && setSelectedMedia(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="w-screen h-screen max-w-none p-0 border-none bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[100] outline-none"
        >
          <div className="sr-only">
            <DialogTitle>Media Viewer</DialogTitle>
          </div>

          {/* Top Toolbar */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-[110] flex items-center justify-end px-6 pt-2 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {selectedMedia && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md shadow-lg transition-all active:scale-95"
                  onClick={(e) =>
                    downloadMedia(e, selectedMedia.url, selectedMedia.type)
                  }
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-all active:scale-95"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {selectedMedia && (
            <div
              className="relative w-full h-full flex items-center justify-center p-0"
              onClick={() => setSelectedMedia(null)}
            >
              <div
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedMedia.type === "video" ? (
                  <div className="w-full h-full max-h-[100vh] max-w-[100vw] aspect-video flex items-center justify-center">
                    <CustomVideoPlayer src={selectedMedia.url} autoPlay />
                  </div>
                ) : (
                  <div className="relative w-full h-full max-h-[95vh] max-w-[95vw]">
                    <Image
                      src={selectedMedia.url}
                      alt="Full view"
                      fill
                      className="object-contain"
                      sizes="100vw"
                      unoptimized={false}
                      priority
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
