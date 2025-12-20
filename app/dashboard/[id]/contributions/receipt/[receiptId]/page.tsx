"use client";

import { useRef, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/components/contributions/receipt-view";
import { ArrowLeft, Printer, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getReceiptDetailsAction } from "@/app/actions/contribution-actions";

export default function ReceiptDetailsPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const receiptId = params.receiptId as string;

  const componentRef = useRef<HTMLDivElement>(null);
  const [contribution, setContribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt-${receiptId}`,
  });

  const handleDownload = async () => {
    if (!componentRef.current) return;

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(componentRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If image is taller than page, scale it down to fit
      if (imgHeight > pageHeight) {
        const scaleFactor = pageHeight / imgHeight;
        imgHeight = pageHeight;
        // We don't need to adjust width because we want to maintain aspect ratio
        // But we should probably center it or just let it be smaller width
        // Actually, if we constrain height, width will shrink too if we want to keep aspect ratio.
        // But jsPDF addImage takes width and height.
        // Let's recalculate width based on new height
        const newWidth = (canvas.width * imgHeight) / canvas.height;
        // Center horizontally
        const x = (imgWidth - newWidth) / 2;
        pdf.addImage(imgData, "PNG", x, 0, newWidth, imgHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }
      pdf.save(`Receipt-${receiptId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const result = await getReceiptDetailsAction(receiptId);

        if (result.error) {
          console.error("Error fetching receipt:", result.error);
          setError(result.error);
        } else if (result.data) {
          const data = result.data;
          setContribution({
            ...data,
            user: Array.isArray(data.users) ? data.users[0] : data.users,
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchReceipt();

    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`receipt-${receiptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `id=eq.${receiptId}`,
        },
        () => {
          fetchReceipt();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
        <div className="flex gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="bg-background border-input text-foreground hover:bg-secondary"
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button
            onClick={() => handlePrint()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
        </div>
      </div>

      <div className="bg-secondary/20 p-4 md:p-8 rounded-xl border border-border/50 flex justify-center overflow-hidden">
        <div className="origin-top transform scale-[0.4] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.85] xl:scale-100 transition-transform duration-300 ease-in-out h-[120mm] sm:h-[150mm] md:h-[210mm] lg:h-[260mm] xl:h-[297mm]">
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
