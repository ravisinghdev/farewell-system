"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Users } from "lucide-react";
import { createChannelAction } from "@/app/actions/chat-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateChannelDialogProps {
  farewellId: string;
  trigger?: React.ReactNode;
}

export function CreateChannelDialog({
  farewellId,
  trigger,
}: CreateChannelDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isCreating, startCreate] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    if (!name.trim()) return;

    startCreate(async () => {
      const result = await createChannelAction(name, farewellId, "group");
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else if (result && result.success) {
        toast.success("Group created!");
        setOpen(false);
        setName("");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = result as any;
        if (res.channelId) {
          router.push(
            `/dashboard/${farewellId}/messages?channel=${res.channelId}`
          );
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create New Group
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Planning Committee"
              className="col-span-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
