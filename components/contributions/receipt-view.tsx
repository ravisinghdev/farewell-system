"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  FileText,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

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
    const isRazorpay = contribution.method === "razorpay";
    const isCash = contribution.method === "cash";
    const receiptNo = contribution.id.slice(0, 8).toUpperCase();
    const date = new Date(contribution.created_at);

    return (
      <div
        ref={ref}
        className="w-full max-w-[210mm] mx-auto bg-white text-black p-12 min-h-[297mm] flex flex-col font-sans relative shadow-2xl"
        id="printable-receipt"
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border-2 border-black/5 pointer-events-none" />
        <div className="absolute inset-5 border border-black/5 pointer-events-none" />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
          <div className="transform -rotate-45 text-[150px] font-bold whitespace-nowrap text-black select-none">
            {contribution.status === "approved" ? "APPROVED" : "PAID"}
          </div>
        </div>

        {/* Header Section */}
        <div className="relative z-10 mb-12">
          <div className="flex justify-between items-start border-b-2 border-black pb-6">
            <div className="flex gap-6">
              <div className="w-20 h-20 bg-black text-white flex items-center justify-center rounded-none shadow-sm">
                <Building2 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-black uppercase">
                  {farewellName}
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Official Farewell Committee
                </p>
                <div className="flex flex-col gap-1 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>Campus Auditorioum, Main Block</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span>committee@farewell.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    <span>www.farewell-system.com</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-bold text-default tracking-tighter">
                RECEIPT
              </h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-semibold">
                Original for Recipient
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12 relative z-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Billed To
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="font-bold text-lg text-black">
                  {contribution.user?.full_name || "Valued Member"}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {contribution.user?.email}
                </p>
                {metadata.contact && (
                  <p className="text-gray-600 text-sm mt-1">
                    {metadata.contact}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Receipt Details
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">Receipt No:</div>
                <div className="font-mono font-bold text-right">
                  #{receiptNo}
                </div>

                <div className="text-gray-500">Date Issued:</div>
                <div className="font-medium text-right">
                  {format(date, "MMMM d, yyyy")}
                </div>

                <div className="text-gray-500">Time:</div>
                <div className="font-medium text-right">
                  {format(date, "h:mm a")}
                </div>

                <div className="text-gray-500">Payment Mode:</div>
                <div className="font-medium text-right capitalize">
                  {contribution.method.replace("_", " ")}
                </div>

                {contribution.transaction_id && (
                  <>
                    <div className="text-gray-500">Transaction Ref:</div>
                    <div className="font-mono text-xs text-right break-all">
                      {contribution.transaction_id}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8 relative z-10 flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider w-16 text-center">
                  #
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-center text-gray-500">01</td>
                <td className="py-4 px-4">
                  <p className="font-bold text-black">
                    Farewell Event Contribution
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Voluntary contribution towards the farewell event expenses.
                    {isRazorpay && " (Online Payment)"}
                    {isCash && " (Cash Payment)"}
                  </p>
                </td>
                <td className="py-4 px-4 text-right font-medium">
                  ₹{contribution.amount.toLocaleString()}
                </td>
              </tr>
              {/* Empty rows to fill space if needed */}
              <tr className="border-b border-gray-100 h-24">
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-12 relative z-10">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₹{contribution.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax (0%)</span>
              <span>₹0.00</span>
            </div>
            <div className="border-t-2 border-black pt-3 flex justify-between items-end">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-3xl">
                ₹{contribution.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="mb-12 relative z-10 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Amount in Words
          </p>
          <p className="text-lg font-medium italic text-black">
            {numberToWords(contribution.amount)} Rupees
          </p>
        </div>

        {/* Footer / Signatures */}
        <div className="mt-auto relative z-10">
          <div className="grid grid-cols-2 gap-12 items-end mb-12">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
                Terms & Conditions
              </h4>
              <ul className="text-[10px] text-gray-500 list-disc pl-3 space-y-1.5">
                <li>
                  This receipt is valid proof of payment for the farewell event.
                </li>
                <li>Contributions are non-refundable and non-transferable.</li>
                <li>
                  Please retain this receipt for future reference and entry
                  verification.
                </li>
                <li>
                  This document is computer generated and does not require a
                  physical signature.
                </li>
              </ul>
            </div>
            <div className="text-center">
              <div className="h-20 mb-2 flex items-end justify-center relative">
                {/* Stamp Effect */}
                <div className="absolute top-0 right-10 transform rotate-12 border-2 border-emerald-500 text-emerald-500 px-3 py-1 rounded text-xs font-bold opacity-80">
                  VERIFIED
                </div>
                <div className="font-script text-3xl text-black">
                  Farewell Committee
                </div>
              </div>
              <div className="border-t border-black w-full pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-black">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-between items-center text-[10px] text-gray-400">
            <div>
              <p>
                Farewell Management System • Generated on{" "}
                {format(new Date(), "PPpp")}
              </p>
              <p className="font-mono mt-0.5">ID: {contribution.id}</p>
            </div>
            <div className="flex gap-4">
              <span>support@farewell.com</span>
              <span>+91 95062 22179</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptView.displayName = "ReceiptView";
