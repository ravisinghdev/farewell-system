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
import { createHighlightAction } from "@/app/actions/dashboard-actions";
import { toast } from "sonner";
import { Loader2, Plus, Image as ImageIcon } from "lucide-react";

interface CreateHighlightDialogProps {
  farewellId: string;
}

export function CreateHighlightDialog({
  farewellId,
}: CreateHighlightDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim()) return;

    startTransition(async () => {
      const res = await createHighlightAction(
        farewellId,
        title,
        description,
        imageUrl,
        link
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Highlight added successfully!");
        setOpen(false);
        setTitle("");
        setDescription("");
        setImageUrl("");
        setLink("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Highlight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Highlight</DialogTitle>
          <DialogDescription>
            Feature a memory, update, or important link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Prom Night Photos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Image URL (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <div className="h-10 w-10 rounded border overflow-hidden shrink-0">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link">External Link (Optional)</Label>
            <Input
              id="link"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief details..."
              className="h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !title.trim()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Highlight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
