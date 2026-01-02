"use client";

import { useTransition, useState } from "react";
import {
  Highlight,
  toggleHighlightReactionAction,
  approveHighlightAction,
  rejectHighlightAction,
  deleteHighlightAction,
} from "@/app/actions/dashboard-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CommentsSection } from "./comments-section";
import { motion, AnimatePresence } from "framer-motion";

interface HighlightCardProps {
  highlight: Highlight & {
    creator?: { full_name: string | null; avatar_url: string | null };
  };
  isAdmin?: boolean;
  onStatusChange?: (id: string, newStatus: string) => void;
  onDelete?: (id: string) => void;
}

export function HighlightCardV2({
  highlight,
  isAdmin,
  onStatusChange,
  onDelete,
}: HighlightCardProps) {
  const [isLikePending, startLikeTransition] = useTransition();
  const [isModPending, startModTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // Optimistic state ideally comes from props

  async function handleReaction(type: string) {
    setIsLiked(!isLiked); // Optimistic
    startLikeTransition(async () => {
      await toggleHighlightReactionAction(highlight.id, type);
    });
  }

  async function handleModerate(status: "approved" | "rejected") {
    startModTransition(async () => {
      const action =
        status === "approved" ? approveHighlightAction : rejectHighlightAction;
      const result = await action(highlight.id, highlight.farewell_id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Post ${status}`);
        onStatusChange?.(highlight.id, status);
      }
    });
  }

  const handleDelete = async () => {
    try {
      const result = await deleteHighlightAction(
        highlight.id,
        highlight.farewell_id
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Highlight deleted");
        onDelete?.(highlight.id);
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={highlight.creator?.avatar_url || ""} />
            <AvatarFallback>
              {highlight.creator?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-sm">
              {highlight.creator?.full_name || "Anonymous"}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(highlight.created_at), {
                  addSuffix: true,
                })}
              </span>
              {isAdmin && highlight.status === "pending" && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1 border-yellow-500/50 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10"
                >
                  Pending Review
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem>Report Post</DropdownMenuItem>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Delete Post
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the highlight.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media - Always Aspect 4/3 */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        {highlight.image_url ? (
          <img
            src={highlight.image_url}
            alt={highlight.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Spacer / Default Gradient if no image */
          <div className="w-full h-full bg-gradient-to-br from-primary/5 via-primary/10 to-transparent flex items-center justify-center">
            <span className="text-4xl opacity-20">✨</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg leading-tight break-words">
          {highlight.title}
        </h3>
        {highlight.description && (
          <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
            {highlight.description}
          </p>
        )}

        {highlight.link && (
          <a
            href={highlight.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-primary/10 break-all"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{highlight.link}</span>
          </a>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 gap-1.5 rounded-full px-3 transition-colors",
              isLiked && "text-red-500 bg-red-50 dark:bg-red-900/10"
            )}
            onClick={() => handleReaction("like")}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            <span className="text-xs font-medium">Like</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-full px-3"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Comment</span>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Admin Moderation Overlay */}
      {isAdmin && highlight.status === "pending" && (
        <div className="absolute inset-x-4 bottom-20 p-4 bg-background/95 backdrop-blur shadow-lg rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col gap-3 z-10">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            Needs Approval
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => handleModerate("rejected")}
              disabled={isModPending}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleModerate("approved")}
              disabled={isModPending}
            >
              {isModPending ? "..." : "Approve"}
            </Button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-muted/30 border-t"
          >
            <CommentsSection
              highlightId={highlight.id}
              farewellId={highlight.farewell_id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
