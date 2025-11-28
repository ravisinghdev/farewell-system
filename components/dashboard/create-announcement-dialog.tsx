"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createAnnouncementAction } from "@/app/actions/dashboard-actions";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface CreateAnnouncementDialogProps {
  farewellId: string;
}

export function CreateAnnouncementDialog({
  farewellId,
}: CreateAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    startTransition(async () => {
      const res = await createAnnouncementAction(
        farewellId,
        title,
        content,
        isPinned
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Announcement posted successfully!");
        setOpen(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
          <DialogDescription>
            Share important updates with everyone in the farewell.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Change in Venue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Details about the announcement..."
              className="h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="pinned"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
            <Label htmlFor="pinned">Pin to top</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !content.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
