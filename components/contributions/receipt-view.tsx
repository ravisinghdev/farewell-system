"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { MapPin, Mail, Globe, Phone } from "lucide-react";

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
    status: string;
  };
  farewellName?: string;
}

function numberToWords(amount: number): string {
  const words = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (amount === 0) return "Zero";

  function convert(n: number): string {
    if (n < 20) return words[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + words[n % 10] : "")
      );
    if (n < 1000)
      return (
        words[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  }

  return convert(amount) + " Only";
}

export const ReceiptView = forwardRef<HTMLDivElement, ReceiptViewProps>(
  ({ contribution, farewellName = "Farewell Event" }, ref) => {
    const metadata = contribution.metadata || {};
    const receiptNo = contribution.id.slice(0, 8).toUpperCase();
    const date = new Date(contribution.created_at);

    return (
      <div
        ref={ref}
        id="printable-receipt"
        className="w-[210mm] h-[297mm] bg-white text-black relative flex flex-col mx-auto overflow-hidden"
        style={{
          padding: "10mm", // Reduced padding to fit content better
          fontFamily: "Arial, Helvetica, sans-serif",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textRendering: "geometricPrecision",
          fontVariantLigatures: "none",
        }}
      >
        {/* Background Pattern/Watermark */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="transform -rotate-45 text-[150px] font-bold text-[#e5e7eb] opacity-20 select-none border-4 border-[#e5e7eb] px-10 rounded-xl">
            PAID
          </div>
        </div>

        {/* Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#111827]" />

        {/* Header */}
        <header className="relative z-10 flex justify-between items-start border-b-2 border-[#f3f4f6] pb-6 mb-6">
          <div className="flex gap-6 items-center">
            <div
              className="w-20 h-20 border border-[#e5e7eb] rounded-lg p-2 flex items-center justify-center bg-white"
              style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
            >
              <img
                src="/favicon.ico"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111827] uppercase">
                {farewellName}
              </h1>
              <p className="text-sm font-medium text-[#6b7280] mt-1">
                Official Farewell Committee
              </p>
              <div className="flex gap-4 mt-3 text-[10px] text-[#6b7280] font-medium uppercase">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> www.farewell-system.com
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> support@farewell.com
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-[#111827] text-white px-4 py-1 text-sm font-bold uppercase mb-2">
              Receipt
            </div>
            <div className="text-3xl font-mono font-bold text-[#111827]">
              #{receiptNo}
            </div>
            <div className="text-xs text-[#6b7280] mt-1 font-medium">
              {format(date, "MMMM d, yyyy")}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-grow">
          {/* Bill To & Details Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column: Bill To */}
            <div>
              <h3 className="text-xs font-bold text-[#9ca3af] uppercase mb-4 border-b border-[#f3f4f6] pb-2">
                Received From
              </h3>
              <div className="space-y-1">
                <p className="text-xl font-bold text-[#111827]">
                  {contribution.user?.full_name || "Valued Member"}
                </p>
                <p className="text-sm text-[#4b5563]">
                  {contribution.user?.email}
                </p>
                {metadata.contact && (
                  <p className="text-sm text-[#4b5563] flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3" /> {metadata.contact}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Payment Details */}
            <div>
              <h3 className="text-xs font-bold text-[#9ca3af] uppercase mb-4 border-b border-[#f3f4f6] pb-2">
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-[#6b7280]">Payment Mode:</span>
                <span className="font-medium text-right capitalize text-[#111827]">
                  {contribution.method.replace("_", " ")}
                </span>

                <span className="text-[#6b7280]">Transaction ID:</span>
                <span className="font-mono text-xs text-right text-[#111827] break-all">
                  {contribution.transaction_id || "N/A"}
                </span>

                <span className="text-[#6b7280]">Status:</span>
                <span className="font-bold text-right text-[#059669] uppercase text-xs border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-0.5 rounded-full inline-block w-fit ml-auto">
                  {contribution.status}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#111827]">
                  <th className="py-3 text-xs font-bold text-[#111827] uppercase w-16">
                    No.
                  </th>
                  <th className="py-3 text-xs font-bold text-[#111827] uppercase">
                    Description
                  </th>
                  <th className="py-3 text-xs font-bold text-[#111827] uppercase text-right w-40">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#f3f4f6]">
                  <td className="py-4 text-sm text-[#6b7280] align-top">01</td>
                  <td className="py-4 align-top">
                    <p className="text-sm font-bold text-[#111827]">
                      Farewell Contribution
                    </p>
                    <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                      Voluntary financial contribution towards the farewell
                      event organization, logistics, and arrangements.
                    </p>
                  </td>
                  <td className="py-4 text-sm font-bold text-[#111827] text-right align-top">
                    ₹{contribution.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Words */}
          <div className="flex flex-col items-end mb-8">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
                <span className="text-sm text-[#6b7280]">Subtotal</span>
                <span className="text-sm font-medium text-[#111827]">
                  ₹{contribution.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-[#111827]">
                <span className="text-base font-bold text-[#111827]">
                  Total Paid
                </span>
                <span className="text-2xl font-bold text-[#111827]">
                  ₹{contribution.amount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 text-right">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">
                Amount in words
              </p>
              <p className="text-sm font-medium text-[#111827] italic">
                {numberToWords(contribution.amount)} Rupees Only
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-auto pt-2 border-t border-[#f3f4f6]">
          <div className="grid grid-cols-2 gap-8 items-end">
            <div>
              <h4 className="text-[10px] font-bold uppercase text-[#111827] mb-2">
                Terms & Conditions
              </h4>
              <p className="text-[10px] text-[#6b7280] leading-relaxed">
                This receipt is an official proof of payment. Contributions are
                non-refundable. Please present this receipt if requested by the
                organizing committee. Generated electronically, signature not
                required.
              </p>
            </div>
            <div className="text-center pl-12">
              <div className="h-16 flex items-end justify-center pb-2">
                <span className="font-script text-2xl text-[#9ca3af] opacity-80 rotate-[-5deg]">
                  Authorized Signature
                </span>
              </div>
              <div className="border-t border-[#d1d5db] pt-2">
                <p className="text-[10px] font-bold uppercase text-[#111827]">
                  Farewell Committee
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 flex justify-between items-center text-[10px] text-[#9ca3af] font-mono uppercase">
            <span>ID: {contribution.id}</span>
            <span>Generated: {format(new Date(), "dd MMM yyyy HH:mm")}</span>
          </div>
        </footer>
      </div>
    );
  }
);

ReceiptView.displayName = "ReceiptView";
