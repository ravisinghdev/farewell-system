"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { CheckCircle2, FileText } from "lucide-react";

interface ReceiptViewProps {
  contribution: {
    id: string;
    amount: number;
    method: string;
    created_at: string;
    transaction_id?: string;
    user?: {
      full_name: string;
      email: string;
    };
    metadata?: any;
  };
  farewellName?: string;
}

export const ReceiptView = forwardRef<HTMLDivElement, ReceiptViewProps>(
  ({ contribution, farewellName = "Farewell Event" }, ref) => {
    const metadata = contribution.metadata || {};
    const isRazorpay = contribution.method === "razorpay";

    return (
      <div
        ref={ref}
        className="w-full max-w-2xl mx-auto bg-white text-black p-12 min-h-[800px] flex flex-col font-sans"
        id="printable-receipt"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black/10 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">
              {farewellName}
            </h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest">
              {isRazorpay ? "Tax Invoice" : "Payment Receipt"}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-emerald-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-sm">
                Paid & Verified
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Date: {format(new Date(contribution.created_at), "MMMM d, yyyy")}
            </p>
            {metadata.invoice_id && (
              <p className="text-sm text-gray-400 font-mono mt-1">
                Invoice #: {metadata.invoice_id}
              </p>
            )}
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-8 text-center border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
            Total Amount Paid
          </p>
          <h2 className="text-5xl font-bold text-black">
            ₹{contribution.amount.toLocaleString()}
          </h2>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12">
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Billed To
            </h3>
            <p className="font-bold text-lg text-black">
              {contribution.user?.full_name || "N/A"}
            </p>
            <p className="text-gray-500">{contribution.user?.email || "N/A"}</p>
            {metadata.contact && (
              <p className="text-gray-500">{metadata.contact}</p>
            )}
          </div>

          <div className="text-right">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Payment Details
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-500 text-sm mr-2">Method:</span>
                <span className="font-medium capitalize">
                  {contribution.method.replace("_", " ")}
                </span>
              </div>
              {contribution.transaction_id && (
                <div>
                  <span className="text-gray-500 text-sm mr-2">Txn ID:</span>
                  <span className="font-mono text-sm">
                    {contribution.transaction_id}
                  </span>
                </div>
              )}
              {metadata.bank && (
                <div>
                  <span className="text-gray-500 text-sm mr-2">Bank:</span>
                  <span className="font-medium">{metadata.bank}</span>
                </div>
              )}
              {metadata.wallet && (
                <div>
                  <span className="text-gray-500 text-sm mr-2">Wallet:</span>
                  <span className="font-medium">{metadata.wallet}</span>
                </div>
              )}
              {metadata.vpa && (
                <div>
                  <span className="text-gray-500 text-sm mr-2">VPA:</span>
                  <span className="font-mono text-sm">{metadata.vpa}</span>
                </div>
              )}
              {metadata.card_id && (
                <div>
                  <span className="text-gray-500 text-sm mr-2">Card:</span>
                  <span className="font-mono text-sm">
                    **** {metadata.card_id.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-gray-100 text-center">
          <div className="flex justify-center mb-4 text-gray-300">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-sm text-gray-400 mb-2">
            This is a computer-generated {isRazorpay ? "invoice" : "receipt"}{" "}
            and does not require a signature.
          </p>
          <p className="text-xs text-gray-300 font-mono">
            Receipt ID: {contribution.id}
          </p>
        </div>
      </div>
    );
  }
);

ReceiptView.displayName = "ReceiptView";
