"use client";

import { Announcement } from "@/app/actions/dashboard-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import {
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Heart,
  Bookmark,
  Share2,
  PinOff,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import {
  deleteAnnouncementAction,
  togglePinAnnouncementAction,
  toggleAnnouncementReactionAction,
  getAnnouncementReactionsAction,
  AnnouncementReactionCounts,
} from "@/app/actions/dashboard-actions";
import { toast } from "sonner";
import { EditAnnouncementDialog } from "./edit-announcement-dialog";
import { useFarewell } from "@/components/providers/farewell-provider";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
  announcement: Announcement;
  isFeatured?: boolean; // Added prop for featured styling
}

export function AnnouncementCard({
  announcement,
  isFeatured,
}: AnnouncementCardProps) {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;
  const userId = user.id;
  const isAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reactions, setReactions] = useState<AnnouncementReactionCounts>({
    likes: 0,
    bookmarks: 0,
    userLiked: false,
    userBookmarked: false,
  });

  useEffect(() => {
    if (userId) {
      getAnnouncementReactionsAction(announcement.id).then(setReactions);
    }
  }, [announcement.id, userId]);

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAnnouncementAction(announcement.id, farewellId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Announcement deleted");
        setShowDeleteDialog(false);
      }
    });
  };

  const handleTogglePin = () => {
    startTransition(async () => {
      const res = await togglePinAnnouncementAction(
        announcement.id,
        farewellId,
        !announcement.is_pinned
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          announcement.is_pinned
            ? "Announcement unpinned"
            : "Announcement pinned"
        );
      }
    });
  };

  const handleToggleReaction = (type: "like" | "bookmark") => {
    if (!userId) {
      toast.error("Please sign in to react");
      return;
    }

    startTransition(async () => {
      const res = await toggleAnnouncementReactionAction(announcement.id, type);
      if (res.error) {
        toast.error(res.error);
      } else {
        // Refresh reactions
        const newReactions = await getAnnouncementReactionsAction(
          announcement.id
        );
        setReactions(newReactions);
      }
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/dashboard/${farewellId}/announcements#${announcement.id}`
      );
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <Card
        id={announcement.id}
        className={cn(
          "relative overflow-hidden transition-all duration-300 group border-0",
          isFeatured
            ? "bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 shadow-xl"
            : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 shadow-lg backdrop-blur-md"
        )}
      >
        {/* Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Avatar
                className={cn(
                  "h-10 w-10 border-2",
                  isFeatured ? "border-primary/30" : "border-white/10"
                )}
              >
                <AvatarImage src={announcement.creator?.avatar_url || ""} />
                <AvatarFallback className="font-semibold bg-background/50">
                  {getInitials(announcement.creator?.full_name || "Admin")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <h3
                  className={cn(
                    "font-bold leading-tight tracking-tight",
                    isFeatured ? "text-xl" : "text-lg"
                  )}
                >
                  {announcement.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
                  <span className="text-xs font-medium">
                    {announcement.creator?.full_name || "Admin"}
                  </span>
                  <span className="text-[10px]">•</span>
                  <span className="text-xs">
                    {format(new Date(announcement.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Menu */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-background/80 backdrop-blur-xl border-white/10"
                >
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTogglePin}>
                    {announcement.is_pinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Pin Badge for Featured */}
            {announcement.is_pinned && !isAdmin && (
              <div className="text-primary/50">
                <Pin className="h-4 w-4 rotate-45" fill="currentColor" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <p className="text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {announcement.content}
          </p>

          {/* User Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 rounded-full h-8 px-3 transition-colors hover:bg-white/10",
                reactions.userLiked &&
                  "text-red-500 bg-red-500/10 hover:bg-red-500/20"
              )}
              onClick={() => handleToggleReaction("like")}
              disabled={isPending}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform active:scale-90",
                  reactions.userLiked && "fill-current"
                )}
              />
              {reactions.likes > 0 && (
                <span className="text-xs font-medium">{reactions.likes}</span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 rounded-full h-8 px-3 transition-colors hover:bg-white/10",
                reactions.userBookmarked &&
                  "text-primary bg-primary/10 hover:bg-primary/20"
              )}
              onClick={() => handleToggleReaction("bookmark")}
              disabled={isPending}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  reactions.userBookmarked && "fill-current"
                )}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full h-8 px-3 ml-auto hover:bg-white/10"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only text-xs">Share</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {isAdmin && (
        <EditAnnouncementDialog
          announcement={announcement}
          farewellId={farewellId}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background/80 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
