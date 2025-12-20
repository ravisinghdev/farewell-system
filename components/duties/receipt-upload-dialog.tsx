"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadDutyReceiptAction } from "@/app/actions/duty-actions";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useFarewell } from "@/components/providers/farewell-provider";

interface ReceiptUploadDialogProps {
  dutyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReceiptUploadDialog({
  dutyId,
  open,
  onOpenChange,
  onSuccess,
}: ReceiptUploadDialogProps) {
  const { farewell } = useFarewell();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !amount) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("dutyId", dutyId);
      formData.append("amount", amount);
      formData.append("notes", notes);

      files.forEach((f) => {
        formData.append("files", f);
      });

      await uploadDutyReceiptAction(farewell.id, formData);
      toast.success("Receipts uploaded successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to upload receipt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Receipt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Receipt Images/PDFs</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="file"
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    setFiles(Array.from(files));
                  }
                }}
                required
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {files.length} file(s) selected
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Merchant name, items purchased, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || files.length === 0 || !amount}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
