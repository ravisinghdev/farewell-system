"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { raiseComplaintAction } from "@/app/actions/chat-actions";

interface ComplaintDialogProps {
  farewellId: string;
  trigger?: React.ReactNode;
}

export function ComplaintDialog({ farewellId, trigger }: ComplaintDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"default_group" | "custom">("default_group");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "custom" && !reason.trim()) return;

    startTransition(async () => {
      const finalReason =
        type === "default_group" ? "Requesting to join default group" : reason;
      const result = await raiseComplaintAction(farewellId, finalReason, type);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Complaint raised. Admins will review it shortly.");
        setOpen(false);
        setReason("");
        setType("default_group");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Raise a Complaint</DialogTitle>
          <DialogDescription>
            Let the admins know about any issues you're facing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Issue Type</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  id="default_group"
                  name="type"
                  value="default_group"
                  checked={type === "default_group"}
                  onChange={() => setType("default_group")}
                  className="accent-primary h-4 w-4"
                />
                <label
                  htmlFor="default_group"
                  className="flex-1 text-sm font-medium cursor-pointer"
                >
                  Can't access Default Group
                  <p className="text-xs text-muted-foreground font-normal">
                    I should be in the main farewell group but I'm not.
                  </p>
                </label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  id="custom"
                  name="type"
                  value="custom"
                  checked={type === "custom"}
                  onChange={() => setType("custom")}
                  className="accent-primary h-4 w-4"
                />
                <label
                  htmlFor="custom"
                  className="flex-1 text-sm font-medium cursor-pointer"
                >
                  Other Issue
                  <p className="text-xs text-muted-foreground font-normal">
                    Describe a specific problem or request.
                  </p>
                </label>
              </div>
            </div>
          </div>

          {type === "custom" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="reason">Description</Label>
              <Textarea
                id="reason"
                placeholder="Please describe the issue in detail..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (type === "custom" && !reason.trim())}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Complaint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
