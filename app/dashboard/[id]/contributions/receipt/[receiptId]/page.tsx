"use client";

import { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/components/contributions/receipt-view";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";

export default function ReceiptDetailsPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const receiptId = params.receiptId as string;

  const componentRef = useRef<HTMLDivElement>(null);
  const [contribution, setContribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt-${receiptId}`,
  });

  useEffect(() => {
    async function fetchReceipt() {
      const supabase = createClient();

      // Fetch contribution with user details
      const { data, error } = await supabase
        .from("contributions")
        .select("*, users(full_name, email)")
        .eq("id", receiptId)
        .single();

      if (data) {
        setContribution({
          ...data,
          user: Array.isArray(data.users) ? data.users[0] : data.users,
        });
      }
      setLoading(false);
    }

    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-white">
        <h2 className="text-2xl font-bold mb-2">Receipt Not Found</h2>
        <Link href={`/dashboard/${farewellId}/contributions/receipt`}>
          <Button variant="outline">Back to Receipts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/${farewellId}/contributions/receipt`}
          className="text-white/60 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
        <Button
          onClick={() => handlePrint()}
          className="bg-white text-black hover:bg-white/90"
        >
          <Printer className="w-4 h-4 mr-2" /> Print / Download PDF
        </Button>
      </div>

      <div className="bg-zinc-900/50 p-8 rounded-xl border border-white/10 overflow-hidden">
        <div className="scale-[0.8] origin-top md:scale-100">
          <ReceiptView
            ref={componentRef}
            contribution={contribution}
            farewellName="Farewell Event"
          />
        </div>
      </div>
    </div>
  );
}
