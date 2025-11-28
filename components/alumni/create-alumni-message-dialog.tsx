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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createAlumniMessageAction } from "@/app/actions/alumni-actions";
import { toast } from "sonner";
import { Loader2, PenLine } from "lucide-react";

interface CreateAlumniMessageDialogProps {
  farewellId: string;
}

export function CreateAlumniMessageDialog({
  farewellId,
}: CreateAlumniMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!content.trim()) return;

    startTransition(async () => {
      const res = await createAlumniMessageAction(farewellId, content);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Message posted successfully!");
        setOpen(false);
        setContent("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PenLine className="h-4 w-4" />
          Write Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Message</DialogTitle>
          <DialogDescription>
            Share your wisdom, advice, or memories with the graduating class.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts..."
              className="h-32 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
