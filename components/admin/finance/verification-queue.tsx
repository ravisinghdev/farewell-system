"use client";

import * as React from "react";
import { Check, X, CreditCard, Calendar, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  approveContribution,
  rejectContribution,
  // getPendingContributions, // Removed
} from "@/app/actions/finance-actions";
import { useFinance } from "@/components/admin/finance/finance-context";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface VerificationQueueProps {
  farewellId: string;
}

export function VerificationQueue({ farewellId }: VerificationQueueProps) {
  const { queue: items, loading, refresh } = useFinance();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Fetching logic moved to Context

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const result =
        action === "approve"
          ? await approveContribution(farewellId, id)
          : await rejectContribution(farewellId, id);

      if (result.success) {
        toast.success(`Payment ${action}d successfully`);
        refresh(); // Refresh context data
      } else {
        toast.error(result.error || `Failed to ${action}`);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading queue...
      </div>
    );

  if (items.length === 0) {
    return (
      <Card className="p-8 md:p-12 text-center border-dashed bg-secondary/20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium">All Caught Up!</h3>
        <p className="text-muted-foreground mt-2">
          No pending payments to review.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Verification Queue
          <Badge variant="secondary" className="rounded-full px-2">
            {items.length}
          </Badge>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden border-muted-foreground/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 bg-secondary/30 border-b border-border/50 flex justify-between items-start">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {item.user?.full_name?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.user?.full_name || "Unknown User"}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.user?.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === "verified" ||
                      item.status === "paid_pending_admin_verification"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize flex-shrink-0 ml-2"
                  >
                    {item.status === "verified" ||
                    item.status === "paid_pending_admin_verification"
                      ? "Double Check"
                      : "New"}
                  </Badge>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Amount
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(item.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col gap-1 p-2 rounded bg-secondary/20">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Method
                      </span>
                      <span className="font-medium capitalize">
                        {item.method?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded bg-secondary/20">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                      </span>
                      <span className="font-medium">
                        {format(new Date(item.created_at), "MMM d")}
                      </span>
                    </div>
                  </div>

                  {item.transaction_id && (
                    <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/50 border border-border/50">
                      <span className="font-mono text-muted-foreground truncate max-w-[150px]">
                        {item.transaction_id}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(item.transaction_id!);
                          toast.success("Copied ID");
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-xs h-8">
                        <Eye className="w-3 h-3 mr-2" /> View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <div className="text-center p-4 space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg">
                            Transaction Details
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Verify the details below before approving.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-left bg-secondary/10 p-4 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              User
                            </p>
                            <p className="font-medium">
                              {item.user?.full_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Amount
                            </p>
                            <p className="font-medium">₹{item.amount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Method
                            </p>
                            <p className="font-medium capitalize">
                              {item.method?.replace("_", " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Date
                            </p>
                            <p className="font-medium">
                              {format(new Date(item.created_at), "PP p")}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Transaction ID
                            </p>
                            <p className="font-mono text-sm break-all">
                              {item.transaction_id}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-2">
                            Screenshot Proof
                          </p>
                          <div className="h-40 w-full bg-secondary/20 rounded-lg flex items-center justify-center border border-dashed border-border">
                            <p className="text-xs text-muted-foreground">
                              Screenshot viewing coming soon
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="p-3 bg-secondary/10 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-red-500/20 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                    onClick={() => handleAction(item.id, "reject")}
                    disabled={!!processingId}
                  >
                    {processingId === item.id ? (
                      "..."
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" /> Reject
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={!!processingId}
                  >
                    {processingId === item.id ? (
                      "Processing..."
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {item.status === "verified" ||
                        item.status === "paid_pending_admin_verification"
                          ? "Confirm"
                          : "Verify"}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
