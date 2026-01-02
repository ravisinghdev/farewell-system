"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAllContributionsAction,
  verifyContributionAction,
  approveContributionAction,
  rejectContributionAction,
} from "@/app/actions/contribution-actions";
import { format } from "date-fns";
import { Loader2, Check, X, Eye, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AddTransactionDialog } from "./add-transaction-dialog";
import Image from "next/image";
import { InvoiceButton } from "@/components/admin/gateway/invoice-button";

interface ContributionManagerProps {
  farewellId: string;
  initialData?: any[];
}

export function ContributionManager({
  farewellId,
  initialData = [],
}: ContributionManagerProps) {
  const [contributions, setContributions] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialData.length === 0) {
      loadContributions();
    }

    const supabase = createClient();
    const channel = supabase
      .channel("admin-contributions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          loadContributions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  async function loadContributions() {
    setLoading(true);
    const data = await getAllContributionsAction(farewellId);
    setContributions(data);
    setLoading(false);
  }

  async function handleVerify(id: string) {
    setProcessingId(id);
    const result = await verifyContributionAction(id);
    if (result.success) {
      toast.success("Contribution verified");
      loadContributions();
    } else {
      toast.error("Failed to verify");
    }
    setProcessingId(null);
  }

  async function handleApprove(id: string) {
    setProcessingId(id);
    const result = await approveContributionAction(id);
    if (result.success) {
      toast.success("Contribution approved & synced to ledger");
      loadContributions();
    } else {
      toast.error(result.error || "Failed to approve");
    }
    setProcessingId(null);
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    const result = await rejectContributionAction(id);
    if (result.success) {
      toast.success("Contribution rejected");
      loadContributions();
    } else {
      toast.error("Failed to reject");
    }
    setProcessingId(null);
  }

  async function handleRefund(id: string) {
    if (!confirm("Are you sure you want to refund this contribution?")) return;
    setProcessingId(id);
    // Dynamic import to avoid circular dependency if any (though unlikely here)
    const { refundContributionAction } = await import(
      "@/app/actions/payment-actions"
    );
    const result = await refundContributionAction(id);
    if (result.success) {
      toast.success("Refund initiated");
      loadContributions();
    } else {
      toast.error(result.error || "Failed to refund");
    }
    setProcessingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Contributions</h2>
        <AddTransactionDialog
          farewellId={farewellId}
          onSuccess={loadContributions}
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Txn ID</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">
                    {c.users?.full_name || c.guest_name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.users?.email ||
                      c.guest_email ||
                      (c.payment_links?.title ? "Guest via Link" : "")}
                  </div>
                </TableCell>
                <TableCell>
                  <div>₹{c.amount}</div>
                  {c.payment_links && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 mt-1 px-1 py-0"
                    >
                      {c.payment_links.title}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="capitalize">
                  {c.method === "ups_manual"
                    ? "Gateway"
                    : c.method.replace("_", " ")}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {c.transaction_id || "-"}
                </TableCell>
                <TableCell>
                  {c.screenshot_url ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Payment Screenshot</DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                          <Image
                            src={c.screenshot_url}
                            alt="Screenshot"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(c.created_at), "MMM d, HH:mm")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Verify Action (for manual/pending) */}
                    {c.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleVerify(c.id)}
                        disabled={!!processingId}
                        title="Verify Details"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Approve Action (Final Step) */}
                    {(c.status === "verified" ||
                      c.status === "paid_pending_admin_verification") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                        onClick={() => handleApprove(c.id)}
                        disabled={!!processingId}
                        title="Approve & Sync to Ledger"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs">Approve</span>
                      </Button>
                    )}

                    {/* Invoice Button */}
                    {(c.status === "approved" || c.status === "verified") && (
                      <InvoiceButton
                        contribution={c}
                        variant="ghost"
                        size="icon"
                      />
                    )}

                    {/* Refund Action */}
                    {(c.status === "verified" || c.status === "approved") &&
                      c.refund_status !== "full" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={() => handleRefund(c.id)}
                          disabled={!!processingId}
                          title="Refund"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                          </svg>
                        </Button>
                      )}

                    {/* Reject Action */}
                    {c.status !== "approved" &&
                      c.status !== "rejected" &&
                      c.status !== "verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(c.id)}
                          disabled={!!processingId}
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {contributions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No contributions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
      );
    case "verified":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Verified</Badge>;
    case "paid_pending_admin_verification":
      return (
        <Badge className="bg-purple-500 hover:bg-purple-600">
          Paid (Review)
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "awaiting_payment":
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Awaiting Payment
        </Badge>
      );
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}
