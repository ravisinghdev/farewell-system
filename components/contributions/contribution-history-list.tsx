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
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
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
      <GlassCard className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2 bg-transparent shadow-none">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No History Yet
        </h3>
        <p className="text-muted-foreground max-w-sm">
          You haven't made any contributions yet. Your payment history will
          appear here once you start contributing.
        </p>
      </GlassCard>
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
        return <Smartphone className="w-5 h-5 text-purple-400" />;
      case "card":
      case "razorpay":
      case "stripe":
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      case "cash":
        return <Wallet className="w-5 h-5 text-green-500" />;
      default:
        return <Wallet className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "verified":
      case "approved":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: "Verified",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-4 h-4 text-red-400" />,
          label: "Rejected",
          className: "bg-red-500/10 text-red-400 border-red-500/20",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          label: "Pending",
          className:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
    }
  };

  return (
    <div className="space-y-4">
      {sorted.map((t, index) => {
        const date = new Date(t.created_at);
        const statusConfig = getStatusConfig(t.status);
        const methodDisplay = t.method.replace("_", " ");

        return (
          <GlassCard
            key={`${t.id}-${index}`}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group relative overflow-hidden"
          >
            {/* Status Line on Left */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                t.status === "verified" || t.status === "approved"
                  ? "bg-emerald-500"
                  : t.status === "rejected"
                  ? "bg-red-500"
                  : "bg-amber-500"
              )}
            />

            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center shrink-0">
                {getMethodIcon(t.method)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-lg">
                    Contribution
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize gap-1.5 pl-1.5 pr-2.5 h-6",
                      statusConfig.className
                    )}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mr-1">
                  <span className="flex items-center gap-1.5">
                    {format(date, "MMM d, yyyy")}{" "}
                    <span className="w-1 h-1 rounded-full bg-border" />{" "}
                    {format(date, "h:mm a")}
                  </span>
                  <span className="capitalize flex items-center gap-1.5 before:content-['•'] before:text-border">
                    Via {methodDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4 sm:border-l border-border">
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  ₹{t.amount.toLocaleString()}
                </p>
                {t.transaction_id && (
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
                    ID: {t.transaction_id}
                  </p>
                )}
              </div>

              {(t.status === "verified" || t.status === "approved") && (
                <Link
                  href={`/dashboard/${farewellId}/contributions/receipt/${t.id}`}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
                    title="Download Receipt"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          </GlassCard>
        );
      })}

      {hasMore && (
        <div className="pt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="bg-background border-border min-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
              </>
            ) : (
              "Load Older History"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
