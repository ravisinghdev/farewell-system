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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [ctaType, setCtaType] = useState("primary");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    // Basic check - strip HTML to see if empty
    const strippedContent = content.replace(/<[^>]*>?/gm, "").trim();

    if (!title.trim() || !strippedContent) {
      toast.error("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      const res = await createAnnouncementAction(
        farewellId,
        title,
        content,
        isPinned,
        ctaLabel,
        ctaLink,
        ctaType
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Announcement posted successfully!");
        setOpen(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
        setCtaLabel("");
        setCtaLink("");
        setCtaType("primary");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 px-3 sm:px-4">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Announcement</span>
          <span className="sm:hidden">New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
          <DialogDescription>
            Share important updates with everyone in the farewell.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
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
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center space-x-2">
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned" className="font-medium">
                Pin to top
              </Label>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Call to Action (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cta-label" className="text-xs">
                    Button Label
                  </Label>
                  <Input
                    id="cta-label"
                    placeholder="e.g. Register"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cta-type" className="text-xs">
                    Type
                  </Label>
                  <select
                    id="cta-type"
                    className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={ctaType}
                    onChange={(e) => setCtaType(e.target.value)}
                  >
                    <option value="primary">Primary (Filled)</option>
                    <option value="secondary">Secondary (Gray)</option>
                    <option value="outline">Outline</option>
                    <option value="destructive">Destructive (Red)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cta-link" className="text-xs">
                  Action URL
                </Label>
                <Input
                  id="cta-link"
                  placeholder="https://..."
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
