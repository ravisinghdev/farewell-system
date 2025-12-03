"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { verifyDutyExpenseAction, completeDutyAction } from "@/actions/duties";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminVerificationPanelProps {
  duty: any;
  onUpdate: () => void;
}

export function AdminVerificationPanel({
  duty,
  onUpdate,
}: AdminVerificationPanelProps) {
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );

  const pendingReceipts =
    duty.duty_receipts?.filter((r: any) => r.status === "pending") || [];

  const handleVerify = async (
    receiptId: string,
    approved: boolean,
    reason?: string
  ) => {
    setProcessing(true);
    try {
      await verifyDutyExpenseAction(receiptId, approved, reason);
      toast.success(approved ? "Expense approved" : "Expense rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to process expense");
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteDuty = async () => {
    setProcessing(true);
    try {
      await completeDutyAction(duty.id);
      toast.success("Duty marked as completed");
      onUpdate();
    } catch (error) {
      toast.error("Failed to complete duty");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pending Expenses</h3>
        {pendingReceipts.length === 0 ? (
          <p className="text-muted-foreground">
            No pending expenses to review.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingReceipts.map((receipt: any) => (
              <div key={receipt.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-lg">
                      ₹{receipt.amount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted by user
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedReceiptId(receipt.id);
                        setRejectDialogOpen(true);
                      }}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerify(receipt.id, true)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </Button>
                  </div>
                </div>

                {receipt.items && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm mb-3">
                    <div className="font-medium mb-1">Itemized List:</div>
                    <ul className="list-disc list-inside">
                      {receipt.items.map((item: any, i: number) => (
                        <li key={i}>
                          {item.description} - ₹{item.amount}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {receipt.evidence_files?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {receipt.evidence_files.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-20 h-20 bg-muted rounded overflow-hidden border"
                      >
                        <img
                          src={url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-2">Duty Completion</h3>
        <p className="text-muted-foreground mb-4">
          Once all expenses are settled and the task is done, you can mark this
          duty as completed.
        </p>
        <Button
          onClick={handleCompleteDuty}
          disabled={
            duty.status === "completed" ||
            processing ||
            pendingReceipts.length > 0
          }
          variant={duty.status === "completed" ? "outline" : "default"}
        >
          {duty.status === "completed"
            ? "Already Completed"
            : "Mark Duty as Completed"}
        </Button>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense claim.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedReceiptId &&
                handleVerify(selectedReceiptId, false, rejectReason)
              }
              disabled={!rejectReason.trim() || processing}
            >
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
