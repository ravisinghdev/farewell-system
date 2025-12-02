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
import {
  approveDutyReceiptAction,
  rejectDutyReceiptAction,
} from "@/app/actions/duty-actions";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import Image from "next/image";
import { useFarewell } from "@/components/providers/farewell-provider";

interface ReceiptApprovalDialogProps {
  receipt: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReceiptApprovalDialog({
  receipt,
  open,
  onOpenChange,
  onSuccess,
}: ReceiptApprovalDialogProps) {
  const { farewell } = useFarewell();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!receipt) return null;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await approveDutyReceiptAction(farewell.id, receipt.id);
      toast.success("Receipt approved");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to approve receipt");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    setProcessing(true);
    try {
      await rejectDutyReceiptAction(farewell.id, receipt.id, rejectionReason);
      toast.success("Receipt rejected");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reject receipt");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Receipt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            {receipt.receipt_url && (
              <Image
                src={receipt.receipt_url}
                alt="Receipt"
                fill
                className="object-contain"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <div className="text-2xl font-bold">₹{receipt.amount}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Uploaded By</Label>
              <div className="font-medium">{receipt.uploader_name}</div>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Notes</Label>
              <div className="text-sm">
                {receipt.notes || "No notes provided"}
              </div>
            </div>
          </div>

          {rejecting && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Input
                id="reason"
                placeholder="Why is this receipt being rejected?"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {!rejecting ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  onClick={() => setRejecting(true)}
                  disabled={processing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setRejecting(false)}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing || !rejectionReason}
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
