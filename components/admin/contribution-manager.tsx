"use client";

import { useState, useEffect } from "react";
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
  updateContributionStatusAction,
} from "@/app/actions/contribution-actions";
import { format } from "date-fns";
import { Loader2, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

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
  }, [farewellId]);

  async function loadContributions() {
    setLoading(true);
    const data = await getAllContributionsAction(farewellId);
    setContributions(data);
    setLoading(false);
  }

  async function handleStatusUpdate(
    id: string,
    status: "verified" | "rejected"
  ) {
    setProcessingId(id);
    const result = await updateContributionStatusAction(id, status);
    if (result.success) {
      toast.success(`Contribution ${status}`);
      loadContributions();
    } else {
      toast.error("Failed to update status");
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
      <div className="rounded-md border">
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
                    {c.profiles?.full_name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.profiles?.email}
                  </div>
                </TableCell>
                <TableCell>₹{c.amount}</TableCell>
                <TableCell className="capitalize">
                  {c.method.replace("_", " ")}
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
                  {c.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleStatusUpdate(c.id, "verified")}
                        disabled={!!processingId}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleStatusUpdate(c.id, "rejected")}
                        disabled={!!processingId}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
  if (status === "verified") {
    return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}
