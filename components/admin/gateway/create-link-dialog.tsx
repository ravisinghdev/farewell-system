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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Link as LinkIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { createPaymentLinkAction } from "@/app/actions/payment-link-actions";

interface CreateLinkDialogProps {
  farewellId: string;
  onSuccess?: () => void;
}

export function CreateLinkDialog({
  farewellId,
  onSuccess,
}: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    slug: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createPaymentLinkAction({
      farewellId,
      title: formData.title,
      amount: parseFloat(formData.amount),
      description: formData.description,
      slug: formData.slug || undefined,
    });

    setLoading(false);

    if (result.success && result.link) {
      toast.success("Payment Link Created!");
      // In prod, use real domain
      const baseUrl = window.location.origin;
      setCreatedLink(`${baseUrl}/pay/${result.link.slug || result.link.id}`);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Failed to create link");
    }
  }

  function copyLink() {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      toast.success("Link copied to clipboard");
      setOpen(false);
      setCreatedLink(null);
      setFormData({ title: "", amount: "", description: "", slug: "" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Payment Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
          <DialogDescription>
            Generate a unique link to accept payments.
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Farewell Contribution"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="2000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Custom Slug (Optional)</Label>
              <Input
                id="slug"
                placeholder="farewell-2026-special"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                farewell.app/pay/...
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  defaultValue={createdLink}
                  readOnly
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="px-3"
                onClick={copyLink}
              >
                <span className="sr-only">Copy</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Share this link to accept payments.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCreatedLink(null)}
            >
              Create Another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
