"use client";

import { Announcement } from "@/app/actions/dashboard-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials, cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Printer,
  Star,
  Reply,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAnnouncementAsReadAction } from "@/app/actions/dashboard-actions";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAnnouncementAction } from "@/app/actions/dashboard-actions";
import { EditAnnouncementDialog } from "@/components/dashboard/edit-announcement-dialog";
import { useFarewell } from "@/components/providers/farewell-provider";
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

interface AnnouncementDetailViewProps {
  announcement: Announcement | null;
  onBack: () => void; // For mobile
}

export function AnnouncementDetailView({
  announcement,
  onBack,
}: AnnouncementDetailViewProps) {
  const { farewell, isAdmin } = useFarewell();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (announcement && !announcement.is_read) {
      markAnnouncementAsReadAction(announcement.id);
    }
  }, [announcement?.id, announcement?.is_read]);

  if (!announcement) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background/20 backdrop-blur-md rounded-2xl border border-white/5 m-2 sm:m-0">
        <div className="text-center space-y-2 p-8">
          <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📬</span>
          </div>
          <h3 className="text-lg font-medium">Select an announcement</h3>
          <p className="text-sm opacity-60 max-w-xs mx-auto">
            Click on an item from the list to view its details here.
          </p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAnnouncementAction(announcement.id, farewell.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Announcement deleted");
        setShowDeleteDialog(false);
        onBack(); // Go back to list (or deselect)
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Subject acts as title here */}
          <h2 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md">
            {announcement.title}
          </h2>
          {announcement.is_pinned && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              Featured
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Metadata Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border border-white/10">
            <AvatarImage src={announcement.creator?.avatar_url || ""} />
            <AvatarFallback>
              {getInitials(announcement.creator?.full_name || "Admin")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <h3 className="font-medium text-base">
                {announcement.creator?.full_name || "Admin"}
                <span className="text-muted-foreground font-normal ml-2 text-sm">{`<${announcement.created_by.slice(
                  0,
                  8
                )}...>`}</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {format(
                  new Date(announcement.created_at),
                  "MMM d, yyyy, h:mm a"
                )}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              to Everyone
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className="prose prose-invert max-w-none prose-sm sm:prose-base leading-relaxed text-foreground/90"
          dangerouslySetInnerHTML={{ __html: announcement.content }}
        />

        {/* Call to Action Button */}
        {announcement.call_to_action_label &&
          announcement.call_to_action_link && (
            <div className="mt-6">
              <Button
                asChild
                variant={
                  announcement.call_to_action_type === "secondary"
                    ? "secondary"
                    : announcement.call_to_action_type === "outline"
                    ? "outline"
                    : announcement.call_to_action_type === "destructive"
                    ? "destructive"
                    : "default"
                }
                className="w-full sm:w-auto min-w-[150px]"
              >
                <a
                  href={announcement.call_to_action_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {announcement.call_to_action_label}
                </a>
              </Button>
            </div>
          )}

        {/* Footer Actions (Reply/Forward style) */}
        <div className="pt-8 flex gap-4">
          <Button variant="outline" className="gap-2">
            <Reply className="h-4 w-4" /> Reply
          </Button>
          {/* Just visual for now */}
        </div>
      </div>

      {/* Dialogs */}
      {isAdmin && (
        <>
          <EditAnnouncementDialog
            announcement={announcement}
            farewellId={farewell.id}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
