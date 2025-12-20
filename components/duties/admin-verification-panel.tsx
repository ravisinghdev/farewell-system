"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  approveDutyReceiptAction,
  rejectDutyReceiptAction,
  updateDutyStatusAction,
} from "@/app/actions/duty-actions";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminVerificationPanelProps {
  duty: any;
  onUpdate: () => void;
}

export function AdminVerificationPanel({
  duty,
  onUpdate,
}: AdminVerificationPanelProps) {
  const [processing, setProcessing] = useState(false);

  // Rejection State
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );

  // Approval Warning State (Over Limit)
  const [approvalWarningOpen, setApprovalWarningOpen] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(
    null
  );

  const pendingReceipts =
    duty.receipts?.filter((r: any) => r.status === "pending") || []; // Changed from duty_receipts to receipts as per duty-actions.ts query structure?
  // Wait, getDutiesAction (Step 62) returns `receipts:duty_receipts`. So `duty.receipts`.
  // The previous code used `duty.duty_receipts`. I should check what is passed prop.
  // If it's passed from `getDuties` in `actions/duties.ts`, it was `duty_receipts`.
  // If it's passed from `getDutiesAction` in `duty-actions.ts`, it is `receipts`.
  // I should support both or check.

  const receiptsList = duty.receipts || duty.duty_receipts || [];
  const pending = receiptsList.filter((r: any) => r.status === "pending");
  const approvedTotal = receiptsList
    .filter((r: any) => r.status === "approved")
    .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

  const handleApproveClick = (receipt: any) => {
    // Check limit
    if (duty.expense_limit > 0) {
      const newTotal = approvedTotal + Number(receipt.amount);
      if (newTotal > duty.expense_limit) {
        setPendingApprovalId(receipt.id);
        setApprovalWarningOpen(true);
        return;
      }
    }
    executeApprove(receipt.id);
  };

  const executeApprove = async (receiptId: string) => {
    setProcessing(true);
    try {
      const result = await approveDutyReceiptAction(
        duty.farewell_id,
        receiptId
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Expense approved");
      setApprovalWarningOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to approve expense");
    } finally {
      setProcessing(false);
    }
  };

  const executeReject = async () => {
    if (!selectedReceiptId || !rejectReason) return;
    setProcessing(true);
    try {
      const result = await rejectDutyReceiptAction(
        duty.farewell_id,
        selectedReceiptId,
        rejectReason
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Expense rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to reject expense");
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteDuty = async () => {
    setProcessing(true);
    try {
      const result = await updateDutyStatusAction(
        duty.farewell_id,
        duty.id,
        "completed"
      );
      if (result.error) throw new Error(result.error);
      toast.success("Duty marked as completed");
      onUpdate();
    } catch (error) {
      toast.error("Failed to complete duty");
    } finally {
      setProcessing(false);
    }
  };

  const limitProgress =
    duty.expense_limit > 0 ? (approvedTotal / duty.expense_limit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="rounded-xl border bg-card/50 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Total Approved
            </div>
            <div className="text-2xl font-bold">
              ₹{approvedTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {duty.expense_limit > 0 && (
          <div className="flex-1 max-w-xs space-y-2 w-full">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Budget Usage</span>
              <span
                className={
                  limitProgress > 100 ? "text-destructive font-bold" : ""
                }
              >
                {Math.round(limitProgress)}% (₹{duty.expense_limit})
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  limitProgress > 100
                    ? "bg-destructive"
                    : limitProgress > 90
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{ width: `${Math.min(limitProgress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          Pending Reviews
          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
            {pending.length}
          </span>
        </h3>

        {pending.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>All cleaned up! No pending receipts.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map((receipt: any) => (
              <div
                key={receipt.id}
                className="group border rounded-xl p-4 bg-card hover:border-primary/50 transition-colors shadow-sm"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">
                        ₹{receipt.amount}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        by {receipt.uploader?.full_name || "Unknown"}
                      </span>
                    </div>
                    {receipt.notes && (
                      <p className="text-sm italic text-muted-foreground bg-secondary/30 p-2 rounded-md border border-border/50">
                        "{receipt.notes}"
                      </p>
                    )}

                    {/* Itemized List Preview */}
                    {receipt.items && receipt.items.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium">Includes:</span>{" "}
                        {receipt.items
                          .map((i: any) => i.description)
                          .join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:items-end gap-3 min-w-[140px]">
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setSelectedReceiptId(receipt.id);
                          setRejectDialogOpen(true);
                        }}
                        disabled={processing}
                      >
                        <XCircle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={() => handleApproveClick(receipt)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Approve</span>
                      </Button>
                    </div>

                    {/* Evidence Links */}
                    <div className="flex gap-2 flex-wrap justify-end">
                      {receipt.evidence_files &&
                      receipt.evidence_files.length > 0 ? (
                        receipt.evidence_files.map((url: string, i: number) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-10 w-10 sm:h-12 sm:w-12 rounded-md overflow-hidden border bg-muted hover:ring-2 ring-primary transition-all"
                            title="View Receipt"
                          >
                            <img
                              src={url}
                              alt="Receipt"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ))
                      ) : receipt.image_url ? (
                        <a
                          href={receipt.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-10 w-10 sm:h-12 sm:w-12 rounded-md overflow-hidden border bg-muted hover:ring-2 ring-primary transition-all"
                        >
                          <img
                            src={receipt.image_url}
                            alt="Receipt"
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary/20 p-6 rounded-xl border border-dashed">
          <div>
            <h3 className="text-lg font-semibold mb-1">Finalize Duty</h3>
            <p className="text-sm text-muted-foreground">
              Mark as completed only after all expenses are approved.
            </p>
          </div>

          <Button
            onClick={handleCompleteDuty}
            disabled={
              duty.status === "completed" || processing || pending.length > 0
            }
            size="lg"
            variant={duty.status === "completed" ? "outline" : "default"}
            className={
              duty.status !== "completed"
                ? "bg-primary text-primary-foreground shadow-lg"
                : ""
            }
          >
            {duty.status === "completed" ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Completed
              </>
            ) : (
              "Mark Duty as Completed"
            )}
          </Button>
        </div>
      </div>

      {/* Reject Dialog */}
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
              onClick={executeReject}
              disabled={!rejectReason.trim() || processing}
            >
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Warning Dialog */}
      <Dialog open={approvalWarningOpen} onOpenChange={setApprovalWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Budget Warning
            </DialogTitle>
            <DialogDescription>
              Approving this receipt will exceed the expense limit for this
              duty.
              <br />
              <br />
              <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Limit:</span> <span>₹{duty.expense_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current:</span> <span>₹{approvedTotal}</span>
                </div>
                <div className="border-t my-1 pt-1 font-bold flex justify-between">
                  <span>New Total:</span>
                  <span className="text-destructive">
                    ₹
                    {approvedTotal +
                      (pendingApprovalId
                        ? Number(
                            pending.find((r: any) => r.id === pendingApprovalId)
                              ?.amount || 0
                          )
                        : 0)}
                  </span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {duty.expense_limit_hard && (
            <Alert variant="destructive">
              <AlertTitle>Action Blocked</AlertTitle>
              <AlertDescription>
                This duty has a hard expense limit. You cannot approve this
                amount.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalWarningOpen(false)}
            >
              Cancel
            </Button>
            {!duty.expense_limit_hard && (
              <Button
                variant="default"
                onClick={() =>
                  pendingApprovalId && executeApprove(pendingApprovalId)
                }
                disabled={processing}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Approve Anyway
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
