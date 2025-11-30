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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createYearbookEntryAction } from "@/app/actions/yearbook-actions";
import { Loader2, Plus } from "lucide-react";

interface CreateYearbookEntryDialogProps {
  farewellId: string;
}

export function CreateYearbookEntryDialog({
  farewellId,
}: CreateYearbookEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("farewellId", farewellId);

    startTransition(async () => {
      const result = await createYearbookEntryAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Entry added!");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Yearbook Entry</DialogTitle>
          <DialogDescription>
            Add a profile to the digital yearbook.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="studentName">Name</Label>
            <Input
              id="studentName"
              name="studentName"
              required
              placeholder="John Doe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section">Section</Label>
            <Select name="section" defaultValue="Students">
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Students">Students</SelectItem>
                <SelectItem value="Teachers">Teachers</SelectItem>
                <SelectItem value="Juniors">Juniors</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quote">Quote</Label>
            <Textarea
              id="quote"
              name="quote"
              placeholder="Your favorite quote..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">Photo</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept="image/*"
              className="cursor-pointer"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
