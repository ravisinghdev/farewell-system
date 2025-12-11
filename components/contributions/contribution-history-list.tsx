"use client";

import { format } from "date-fns";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

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
  transactions: Transaction[];
  farewellId: string;
}

export function ContributionHistoryList({
  transactions,
  farewellId,
}: ContributionHistoryListProps) {
  if (transactions.length === 0) {
    return (
      <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-white/40" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No History Yet</h3>
        <p className="text-white/60 max-w-sm">
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
        return <Wallet className="w-5 h-5 text-green-400" />;
      default:
        return <Wallet className="w-5 h-5 text-white/60" />;
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
          icon: <Clock className="w-4 h-4 text-amber-400" />,
          label: "Pending",
          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
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
            key={t.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/5 transition-colors group relative overflow-hidden"
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
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {getMethodIcon(t.method)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg">Contribution</h3>
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

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/50">
                  <span className="flex items-center gap-1.5">
                    {format(date, "MMM d, yyyy")}{" "}
                    <span className="w-1 h-1 rounded-full bg-white/30" />{" "}
                    {format(date, "h:mm a")}
                  </span>
                  <span className="capitalize flex items-center gap-1.5 before:content-['•'] before:text-white/20">
                    Via {methodDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4 sm:border-l border-white/5">
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-white tracking-tight">
                  ₹{t.amount.toLocaleString()}
                </p>
                {t.transaction_id && (
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest truncate max-w-[120px]">
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
                    className="h-10 w-10 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
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
    </div>
  );
}
