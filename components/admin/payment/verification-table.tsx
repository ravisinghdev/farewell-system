"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { verifyPaymentAction } from "@/app/actions/payout-actions";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationTableProps {
  requests: any[]; // Contribution requests
  farewellId: string;
}

export function VerificationTable({
  requests,
  farewellId,
}: VerificationTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleVerify = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await verifyPaymentAction(id, farewellId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment verified");
      }
    } catch (e) {
      toast.error("Failed to verify");
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
        No pending verification requests.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium">
                {req.users?.full_name || "Unknown User"}
              </TableCell>
              <TableCell>₹{req.amount}</TableCell>
              <TableCell>
                {new Date(req.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{req.status}</Badge>
              </TableCell>
              <TableCell className="text-right flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => handleVerify(req.id)}
                  disabled={loadingId === req.id}
                >
                  {loadingId === req.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </>
                  )}
                </Button>
                {/* Reject logic can be added later */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
