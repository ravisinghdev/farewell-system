"use client";

import { useState, useRef } from "react";
import {
  Duty,
  DutyReceipt,
  uploadDutyReceiptAction,
  approveDutyReceiptAction,
  rejectDutyReceiptAction,
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
import { Card } from "@/components/ui/card"; // Assuming Card exists or use div
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  UploadCloud,
  X,
  FileText,
  Check,
  Ban,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface ReceiptManagerProps {
  duty: Duty;
  farewellId: string;
  isAssignee: boolean;
  isAdmin: boolean;
}

export function ReceiptManager({
  duty,
  farewellId,
  isAssignee,
  isAdmin,
}: ReceiptManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    formData.append("notes", notes);
    formData.append("file", selectedFile);

    try {
      const result = await uploadDutyReceiptAction(farewellId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Receipt uploaded successfully!");
        setAmount("");
        setNotes("");
        setSelectedFile(null);
      }
    } catch (error) {
      toast.error("Failed to upload receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  // Approval/Rejection Handlers
  const handleApprove = async (receiptId: string) => {
    const result = await approveDutyReceiptAction(farewellId, receiptId);
    if (result.error) toast.error(result.error);
    else toast.success("Receipt approved");
  };

  const handleReject = async (receiptId: string) => {
    const result = await rejectDutyReceiptAction(farewellId, receiptId);
    if (result.error) toast.error(result.error);
    else toast.success("Receipt rejected");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-2">
          <DollarSign className="w-3 h-3" /> Expenses & Receipts
        </h4>
        {isAssignee && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <UploadCloud className="w-3 h-3 mr-1.5" /> Upload Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Expense Receipt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-9 bg-white/5 border-white/10"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="What is this for?"
                    className="bg-white/5 border-white/10 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Receipt Image</label>
                  <div
                    className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-emerald-400">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-zinc-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-center text-zinc-500">
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
          <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-white/[0.02]">
            <p className="text-xs text-zinc-500">No receipts uploaded yet.</p>
          </div>
        )}

        {duty.receipts?.map((receipt) => (
          <div
            key={receipt.id}
            className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-3"
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
                  <p className="text-xs font-medium text-white">
                    {receipt.uploader?.full_name}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {format(new Date(receipt.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  {formatCurrency(receipt.amount)}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 px-1.5 ${
                    receipt.status === "approved"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : receipt.status === "rejected"
                      ? "text-red-400 border-red-500/30 bg-red-500/10"
                      : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                  }`}
                >
                  {receipt.status}
                </Badge>
              </div>
            </div>

            {receipt.image_url && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/50 border border-white/5 group">
                {/* Use img for simplicity, or Next Image */}
                <img
                  src={receipt.image_url}
                  alt="Receipt"
                  className="object-contain w-full h-full"
                />
                <a
                  href={receipt.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-xs font-medium underline">
                    View Full Size
                  </span>
                </a>
              </div>
            )}

            {receipt.notes && (
              <p className="text-xs text-zinc-400 bg-white/5 p-2 rounded-md">
                "{receipt.notes}"
              </p>
            )}

            {isAdmin && receipt.status === "pending" && (
              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => handleReject(receipt.id)}
                >
                  <Ban className="w-3 h-3 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => handleApprove(receipt.id)}
                >
                  <Check className="w-3 h-3 mr-1" /> Approve
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
