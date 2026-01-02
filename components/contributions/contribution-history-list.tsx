"use client";

import { format } from "date-fns";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Smartphone,
  Wallet,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { useState, useEffect } from "react";
import { getUserContributionsPaginatedAction } from "@/app/actions/contribution-actions";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  transaction_id: string | null;
  users?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface ContributionHistoryListProps {
  initialTransactions: Transaction[];
  farewellId: string;
  initialTotal: number;
}

export function ContributionHistoryList({
  initialTransactions,
  farewellId,
  initialTotal,
}: ContributionHistoryListProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialTransactions.length < initialTotal
  );

  // Sync with server updates (Realtime)
  useEffect(() => {
    setTransactions(initialTransactions);
    setPage(1);
    setHasMore(initialTransactions.length < initialTotal);
  }, [initialTransactions, initialTotal]);

  useRealtimeSubscription({
    table: "contributions",
    filter: `farewell_id=eq.${farewellId}`,
  });

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getUserContributionsPaginatedAction(
        farewellId,
        nextPage,
        10
      );

      if (res.data.length > 0) {
        setTransactions((prev) => [...prev, ...(res.data as any)]);
        setPage(nextPage);
        setHasMore(transactions.length + res.data.length < res.total);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load more history");
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No History Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Start contributing to see your payment history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by date desc just in case
  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "upi":
        return <Smartphone className="w-4 h-4" />;
      case "card":
      case "razorpay":
        return <CreditCard className="w-4 h-4" />;
      case "cash":
        return <Wallet className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 gap-1.5 font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 gap-1.5 font-medium"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </Badge>
        );
      case "paid_pending_admin_verification":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 gap-1.5 font-medium"
          >
            <Clock className="w-3.5 h-3.5" />
            Wait for Approval
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 gap-1.5 font-medium"
          >
            <Clock className="w-3.5 h-3.5" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
            <TableRow>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((t) => {
              const date = new Date(t.created_at);

              return (
                <TableRow key={t.id} className="group">
                  <TableCell className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {format(date, "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px]">
                        {format(date, "h:mm a")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm capitalize">
                      {getMethodIcon(t.method)}
                      {t.method.replace("_", " ")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="font-mono text-xs text-muted-foreground truncate max-w-[150px] block"
                      title={t.transaction_id || "-"}
                    >
                      {t.transaction_id || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{t.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          asChild
                          disabled={
                            t.status !== "verified" && t.status !== "approved"
                          }
                        >
                          <Link
                            href={`/dashboard/${farewellId}/contributions/receipt/${t.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Receipt
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
            size="sm"
            className="text-xs"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Loading...
              </>
            ) : (
              "Load Older Records"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
