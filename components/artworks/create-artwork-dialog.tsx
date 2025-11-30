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
import { toast } from "sonner";
import { createArtworkAction } from "@/app/actions/artwork-actions";
import { Loader2, Plus } from "lucide-react";

interface CreateArtworkDialogProps {
  farewellId: string;
}

export function CreateArtworkDialog({ farewellId }: CreateArtworkDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("farewellId", farewellId);

    startTransition(async () => {
      const result = await createArtworkAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Artwork submitted!");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit Artwork
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Artwork</DialogTitle>
          <DialogDescription>
            Share your creative work with the farewell community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="My Masterpiece"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="artistName">Artist Name (Optional)</Label>
            <Input
              id="artistName"
              name="artistName"
              placeholder="Leave blank to use your name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Tell us about this piece..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">Artwork Image</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept="image/*"
              required
              className="cursor-pointer"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
