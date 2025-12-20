"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, User, Loader2, Plus, PenTool } from "lucide-react";
import {
  deleteYearbookEntryAction,
  getYearbookEntriesAction,
} from "@/app/actions/yearbook-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

interface YearbookEntry {
  id: string;
  student_name: string;
  quote: string | null;
  photo_url: string | null;
  section: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface YearbookGridProps {
  entries: YearbookEntry[];
  total: number;
  farewellId: string;
}

export function YearbookGrid({
  entries: initialEntries,
  total,
  farewellId,
}: YearbookGridProps) {
  const [entries, setEntries] = useState<YearbookEntry[]>(initialEntries);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const LIMIT = 12;
  const hasMore = entries.length < total;

  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Filter out locally deleted items
  // Sync state when server revalidates
  const [prevInitialEntries, setPrevInitialEntries] = useState(initialEntries);
  if (initialEntries !== prevInitialEntries) {
    setEntries(initialEntries.filter((e) => !deletedIds.has(e.id)));
    setPrevInitialEntries(initialEntries);
    setPage(1);
  }

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const { data: newEntries } = await getYearbookEntriesAction(
        farewellId,
        nextPage,
        LIMIT
      );

      if (newEntries?.length) {
        setEntries((prev) => [
          ...prev,
          ...newEntries.filter((e) => !deletedIds.has(e.id)),
        ]);
        setPage(nextPage);
      } else {
        toast.info("No more entries to load");
      }
    } catch (error) {
      toast.error("Failed to load more entries");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;

    const idToDelete = entryToDelete;

    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== idToDelete));
    setDeletedIds((prev) => new Set(prev).add(idToDelete));
    setEntryToDelete(null);

    startTransition(async () => {
      const result = await deleteYearbookEntryAction(idToDelete, farewellId);
      if (result.error) {
        toast.error(result.error);
        // Could revert deletedIds here if critical
      } else {
        toast.success("Entry deleted");
      }
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/20 animate-in fade-in zoom-in duration-500">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <PenTool className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No signatures yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
          Be the first to sign the digital yearbook.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="h-full"
              layout
            >
              <Card className="overflow-hidden group h-full flex flex-col border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-3xl">
                <div className="relative aspect-square bg-muted/50 overflow-hidden">
                  {entry.photo_url ? (
                    <Image
                      src={entry.photo_url}
                      alt={entry.student_name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                      <User className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {entry.section && (
                    <Badge
                      className="absolute top-3 right-3 backdrop-blur-md bg-black/40 text-white border-white/20 hover:bg-black/60"
                      variant="secondary"
                    >
                      {entry.section}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                      {entry.student_name}
                    </h3>
                    <div className="h-1 w-12 bg-primary/20 rounded-full my-3 group-hover:w-20 group-hover:bg-primary transition-all duration-500" />
                  </div>

                  {entry.quote && (
                    <blockquote className="text-sm italic text-muted-foreground/80 font-serif leading-relaxed">
                      "{entry.quote}"
                    </blockquote>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hover:bg-destructive/10"
                    onClick={() => setEntryToDelete(entry.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
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
            Load More Signatures
          </Button>
        </div>
      )}
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={() => setEntryToDelete(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this signature?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanent remove this
              entry from the yearbook.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setEntryToDelete(null)}
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
