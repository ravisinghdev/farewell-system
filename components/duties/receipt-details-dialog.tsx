"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ReceiptDetailsDialogProps {
  receipt: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onVote: (receiptId: string) => void;
}

export function ReceiptDetailsDialog({
  receipt,
  open,
  onOpenChange,
  currentUserId,
  onVote,
}: ReceiptDetailsDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!receipt) return null;

  const nextImage = () => {
    if (
      receipt.evidence_files &&
      currentImageIndex < receipt.evidence_files.length - 1
    ) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">₹{receipt.amount}</div>
                <div className="text-sm text-muted-foreground">
                  Submitted on {format(new Date(receipt.created_at), "PPP")}
                </div>
              </div>
              <Badge
                variant={
                  receipt.status === "approved"
                    ? "default"
                    : receipt.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {receipt.status}
              </Badge>
            </div>

            {receipt.items && receipt.items.length > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Itemized List</h4>
                <ul className="space-y-2">
                  {receipt.items.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span className="font-medium">₹{item.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-3 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{receipt.amount}</span>
                </div>
              </div>
            )}

            {receipt.evidence_files && receipt.evidence_files.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Receipt Images</h4>
                <div className="relative border rounded-lg overflow-hidden bg-muted/20 group">
                  <img
                    src={receipt.evidence_files[currentImageIndex]}
                    alt={`Receipt Evidence ${currentImageIndex + 1}`}
                    className="w-full h-auto object-contain max-h-[500px]"
                  />

                  {receipt.evidence_files.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        onClick={nextImage}
                        disabled={
                          currentImageIndex ===
                          receipt.evidence_files.length - 1
                        }
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentImageIndex + 1} /{" "}
                        {receipt.evidence_files.length}
                      </div>
                    </>
                  )}
                </div>

                {receipt.evidence_files.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {receipt.evidence_files.map(
                      (url: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                            index === currentImageIndex
                              ? "border-primary"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${index}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {receipt.admin_notes && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-600 mb-1">
                  Admin Notes
                </h4>
                <p className="text-sm">{receipt.admin_notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant={
                  receipt.receipt_votes?.some(
                    (v: any) => v.user_id === currentUserId
                  )
                    ? "secondary"
                    : "default"
                }
                className={`gap-2 ${
                  receipt.receipt_votes?.some(
                    (v: any) => v.user_id === currentUserId
                  )
                    ? "text-red-500"
                    : ""
                }`}
                onClick={() => onVote(receipt.id)}
              >
                <Heart
                  className={`h-4 w-4 ${
                    receipt.receipt_votes?.some(
                      (v: any) => v.user_id === currentUserId
                    )
                      ? "fill-current"
                      : ""
                  }`}
                />
                {receipt.receipt_votes?.some(
                  (v: any) => v.user_id === currentUserId
                )
                  ? "Voted"
                  : "Vote to Verify"}
                <span className="ml-1 bg-background/20 px-2 py-0.5 rounded text-xs">
                  {receipt.receipt_votes?.length || 0}
                </span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
