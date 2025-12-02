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

interface AnnouncementCardProps {
  announcement: Announcement;
  // Props are now optional/unused as we use context
  farewellId?: string;
  isAdmin?: boolean;
  userId?: string;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
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
        className="relative overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-primary/50 group"
      >
        {/* Pin Icon - positioned to avoid overlap with admin menu */}
        {announcement.is_pinned && (
          <div
            className={`absolute top-2 ${
              isAdmin ? "right-12" : "right-2"
            } z-10`}
          >
            <div className="backdrop-blur-sm rounded-full p-1.5">
              <Pin className="h-3.5 w-3.5 rotate-45" fill="currentColor" />
            </div>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={announcement.creator?.avatar_url || ""} />
                <AvatarFallback className="font-semibold">
                  {getInitials(announcement.creator?.full_name || "Admin")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <h3 className="font-semibold leading-none tracking-tight text-lg">
                  {announcement.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm">
                    {announcement.creator?.full_name || "Admin"}
                  </span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">
                    {format(
                      new Date(announcement.created_at),
                      "MMM d, yyyy • h:mm a"
                    )}
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
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </p>

          {/* User Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${reactions.userLiked ? "" : ""}`}
              onClick={() => handleToggleReaction("like")}
              disabled={isPending}
            >
              <Heart
                className="h-4 w-4"
                fill={reactions.userLiked ? "currentColor" : "none"}
              />
              {reactions.likes > 0 && (
                <span className="text-xs font-medium">{reactions.likes}</span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${reactions.userBookmarked ? "" : ""}`}
              onClick={() => handleToggleReaction("bookmark")}
              disabled={isPending}
            >
              <Bookmark
                className="h-4 w-4"
                fill={reactions.userBookmarked ? "currentColor" : "none"}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className=""
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
