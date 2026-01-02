"use client";

import * as React from "react";
import {
  Check,
  X,
  CreditCard,
  Calendar,
  Copy,
  Eye,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  approveContribution,
  rejectContribution,
} from "@/app/actions/finance-actions";
import { useFinance } from "@/components/admin/finance/finance-context";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VerificationQueueProps {
  farewellId: string;
}

export function VerificationQueue({ farewellId }: VerificationQueueProps) {
  const { queue: items, loading, refresh } = useFinance();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

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
      <div className="p-8 text-center text-muted-foreground text-sm">
        Loading queue...
      </div>
    );

  if (items.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-500">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium">All Caught Up!</h3>
          <p className="text-xs text-muted-foreground mt-1">
            No pending payments to review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Verification Queue
          <Badge
            variant="secondary"
            className="rounded-full px-2 text-xs font-normal"
          >
            {items.length}
          </Badge>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0 pb-3 border-b">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-muted text-xs">
                        {item.user?.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.user?.full_name || "Unknown User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.user?.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === "verified" ||
                      item.status === "paid_pending_admin_verification"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px] px-1.5 h-5 capitalize flex-shrink-0"
                  >
                    {item.status === "verified" ||
                    item.status === "paid_pending_admin_verification"
                      ? "Unverified"
                      : "New"}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">
                      Amount
                    </span>
                    <span className="text-lg font-bold">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(item.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" /> Method
                      </span>
                      <span className="font-medium capitalize pl-4.5">
                        {item.method?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end text-right">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        Date <Calendar className="w-3 h-3" />
                      </span>
                      <span className="font-medium">
                        {format(new Date(item.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>

                  {item.transaction_id && (
                    <div className="bg-muted/40 p-2 rounded text-[10px] flex items-center justify-between border border-dashed">
                      <span className="text-muted-foreground font-mono truncate max-w-[140px]">
                        {item.transaction_id}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1"
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                      >
                        <Eye className="w-3 h-3 mr-2" /> View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription>
                          Review payment information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Contributor
                            </span>
                            <p className="font-medium">
                              {item.user?.full_name}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Amount
                            </span>
                            <p className="font-medium">₹{item.amount}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Payment Method
                            </span>
                            <p className="font-medium capitalize">
                              {item.method?.replace("_", " ")}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Date
                            </span>
                            <p className="font-medium">
                              {format(new Date(item.created_at), "PP p")}
                            </p>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Transaction ID
                            </span>
                            <p className="font-mono text-xs bg-muted p-1 rounded">
                              {item.transaction_id}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            Payment Screenshot
                          </span>
                          <div className="h-32 w-full bg-muted/30 rounded-md border border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <ImageIcon className="w-8 h-8 opacity-20" />
                            <span className="text-xs">
                              No screenshot available
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>

                <CardFooter className="p-3 bg-muted/20 border-t grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8"
                    onClick={() => handleAction(item.id, "reject")}
                    disabled={!!processingId}
                  >
                    {processingId === item.id ? "..." : "Reject"}
                  </Button>
                  <Button
                    size="sm"
                    className="h-8" // Added explicit height to match Reject button
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={!!processingId}
                  >
                    {processingId === item.id ? (
                      "..."
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Verify
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
