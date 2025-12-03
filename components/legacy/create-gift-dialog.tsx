"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Loader2 } from "lucide-react";
import { createGiftAction } from "@/app/actions/legacy-actions";
import { toast } from "sonner";

export function CreateGiftDialog({ farewellId }: { farewellId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message") as string;
    const giftType = formData.get("giftType") as string;

    try {
      await createGiftAction(farewellId, message, giftType);
      toast.success("Gift sent successfully");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Gift className="mr-2 h-4 w-4" />
          Send Gift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Send a Gift</DialogTitle>
            <DialogDescription>
              Send a virtual gift and a message to the batch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="giftType">Gift Type</Label>
              <Select name="giftType" required defaultValue="gift_box">
                <SelectTrigger>
                  <SelectValue placeholder="Select a gift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gift_box">🎁 Gift Box</SelectItem>
                  <SelectItem value="flower">🌸 Flower Bouquet</SelectItem>
                  <SelectItem value="trophy">🏆 Trophy</SelectItem>
                  <SelectItem value="star">⭐ Shining Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                name="message"
                placeholder="Best wishes for the future!"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Gift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
