"use client";

import { useState, useRef } from "react";
import {
  Duty,
  DutyReceipt,
  uploadDutyReceiptAction,
  approveDutyReceiptAction,
  rejectDutyReceiptAction,
  castReceiptVoteAction,
} from "@/app/actions/duty-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  UploadCloud,
  Check,
  Ban,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ImageViewer } from "@/components/ui/image-viewer";

interface ReceiptManagerProps {
  duty: Duty;
  farewellId: string;
  isAssignee: boolean;
  isAdmin: boolean;
  currentUserId?: string;
}

export function ReceiptManager({
  duty,
  farewellId,
  isAssignee,
  isAdmin,
  currentUserId,
}: ReceiptManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("upi");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Image Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState("");
  const [viewerAlt, setViewerAlt] = useState("");

  const router = useRouter();

  // Upload Handler
  const handleUpload = async () => {
    if (!selectedFile || !amount) {
      toast.error("Please provide an amount and a receipt image.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("dutyId", duty.id);
    formData.append("amount", amount);
    formData.append("paymentMode", paymentMode);
    formData.append("file", selectedFile);

    try {
      const result = await uploadDutyReceiptAction(farewellId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Receipt uploaded successfully!");
        setAmount("");
        setSelectedFile(null);
        setDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to upload receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVote = async (receiptId: string, vote: "valid" | "invalid") => {
    const result = await castReceiptVoteAction(farewellId, receiptId, vote);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Vote recorded");
      router.refresh(); // Ensure refresh happens
    }
  };

  // Approval/Rejection Handlers
  const handleApprove = async (receiptId: string) => {
    const result = await approveDutyReceiptAction(farewellId, receiptId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Receipt approved");
      router.refresh();
    }
  };

  const handleReject = async (receiptId: string) => {
    // Simple reject for now
    const result = await rejectDutyReceiptAction(
      farewellId,
      receiptId,
      "Admin rejected"
    );
    if (result.error) toast.error(result.error);
    else {
      toast.success("Receipt rejected");
      router.refresh();
    }
  };

  const openViewer = (src: string, alt: string) => {
    setViewerSrc(src);
    setViewerAlt(alt);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* View Only */}
      <ImageViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        src={viewerSrc}
        alt={viewerAlt}
      />

      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
          <DollarSign className="w-3 h-3" /> Expenses & Receipts
        </h4>
        {isAssignee && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <UploadCloud className="w-3 h-3 mr-1.5" /> Upload Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border text-foreground sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Expense Receipt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount Paid</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-9 bg-muted/30 border-input text-foreground"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Mode</label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="bg-muted/30 border-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Receipt Image</label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-emerald-500">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Click to select image</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0])
                          setSelectedFile(e.target.files[0]);
                      }}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Submit Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {(!duty.receipts || duty.receipts.length === 0) && (
          <div className="text-center py-6 border border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-xs text-muted-foreground">
              No receipts uploaded yet.
            </p>
          </div>
        )}

        {duty.receipts?.map((receipt) => {
          const validVotes =
            receipt.votes?.filter((v) => v.vote === "valid").length || 0;
          const invalidVotes =
            receipt.votes?.filter((v) => v.vote === "invalid").length || 0;
          const hasVoted = receipt.votes?.some(
            (v) => v.voter_id === currentUserId
          );

          return (
            <div
              key={receipt.id}
              className="bg-card border border-border rounded-xl p-3 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={receipt.uploader?.avatar_url} />
                    <AvatarFallback className="text-[9px]">
                      {receipt.uploader?.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {receipt.uploader?.full_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(receipt.created_at), "MMM d, h:mm a")}{" "}
                      via{" "}
                      <span className="uppercase">{receipt.payment_mode}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(receipt.amount_paid)}
                  </p>
                  <div className="flex justify-end mt-1">
                    <Badge
                      variant="outline"
                      className={`text-[9px] h-5 px-1.5 ${
                        receipt.status === "approved"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : receipt.status === "rejected"
                          ? "text-red-400 border-red-500/30 bg-red-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      }`}
                    >
                      {receipt.status === "pending_vote"
                        ? "Voting"
                        : receipt.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {receipt.image_url && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/50 border border-border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receipt.image_url}
                    alt="Receipt"
                    className="object-contain w-full h-full cursor-zoom-in"
                    onClick={() => openViewer(receipt.image_url, "Receipt")}
                  />
                  <div
                    onClick={() => openViewer(receipt.image_url, "Receipt")}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="text-xs font-medium underline">
                      View Full Size
                    </span>
                  </div>
                </div>
              )}

              {/* Voting / Actions Section */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                {/* Votes Count */}
                <div className="flex items-center gap-2">
                  {validVotes > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-5">
                      {validVotes} Valid
                    </Badge>
                  )}
                  {invalidVotes > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-[9px] h-5 opacity-80"
                    >
                      {invalidVotes} Invalid
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {receipt.status === "pending_vote" &&
                    currentUserId &&
                    !hasVoted && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVote(receipt.id, "valid")}
                          className="h-6 px-2 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" /> Valid
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVote(receipt.id, "invalid")}
                          className="h-6 px-2 text-red-400 hover:bg-red-500/10"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" /> Invalid
                        </Button>
                      </>
                    )}

                  {receipt.status === "pending_vote" && hasVoted && (
                    <span className="text-[10px] text-muted-foreground italic">
                      You voted
                    </span>
                  )}

                  {isAdmin &&
                    receipt.status !== "approved" &&
                    receipt.status !== "rejected" && (
                      <>
                        <div className="w-px h-3 bg-border mx-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleReject(receipt.id)}
                          title="Reject"
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          onClick={() => handleApprove(receipt.id)}
                          title="Approve"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
