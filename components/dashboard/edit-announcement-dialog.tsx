"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { updateAnnouncementAction } from "@/app/actions/dashboard-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Announcement } from "@/app/actions/dashboard-actions";

interface EditAnnouncementDialogProps {
  announcement: Announcement;
  farewellId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAnnouncementDialog({
  announcement,
  farewellId,
  open,
  onOpenChange,
}: EditAnnouncementDialogProps) {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [isPinned, setIsPinned] = useState(announcement.is_pinned);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsPinned(announcement.is_pinned);
  }, [announcement]);

  const handleSubmit = () => {
    // Basic check - strip HTML to see if empty
    const strippedContent = content.replace(/<[^>]*>?/gm, "").trim();

    if (!title.trim() || !strippedContent) return;

    startTransition(async () => {
      const res = await updateAnnouncementAction(
        announcement.id,
        farewellId,
        title,
        content,
        isPinned
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Announcement updated successfully!");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update the announcement details below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="e.g., Change in Venue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              className="min-h-[200px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-pinned"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
            <Label htmlFor="edit-pinned">Pin to top</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
