"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";

interface InvoiceButtonProps {
  contribution: any; // Type this properly in real app
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "icon" | "default";
  className?: string;
  children?: React.ReactNode;
}

export function InvoiceButton({
  contribution,
  variant = "outline",
  size = "sm",
  className,
  children,
}: InvoiceButtonProps) {
  function generatePDF() {
    const doc = new jsPDF();
    const c = contribution;
    const user = c.users || {
      full_name: c.guest_name || "Guest",
      email: c.guest_email || "",
    };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("RECEIPT", 105, 20, { align: "center" });

    // Company / Event Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Farewell Organization Committee", 105, 28, { align: "center" });

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Details Grid
    doc.setFontSize(10);
    doc.setTextColor(60);

    let y = 50;
    const leftX = 20;
    const rightX = 120;
    const gap = 10;

    // Receipt No
    doc.text("Receipt No:", leftX, y);
    doc.setTextColor(0);
    doc.text(c.id.slice(0, 8).toUpperCase(), leftX + 30, y);

    // Date
    doc.setTextColor(60);
    doc.text("Date:", rightX, y);
    doc.setTextColor(0);
    doc.text(format(new Date(c.created_at), "PPP"), rightX + 20, y);

    y += gap;

    // Payer
    doc.setTextColor(60);
    doc.text("Received From:", leftX, y);
    doc.setTextColor(0);
    doc.text(user.full_name, leftX + 30, y);

    // Method
    doc.setTextColor(60);
    doc.text("Payment Mode:", rightX, y);
    doc.setTextColor(0);
    doc.text(
      (c.method || "Unknown").toUpperCase().replace("_", " "),
      rightX + 25,
      y
    );

    y += gap;

    // Transaction ID
    doc.setTextColor(60);
    doc.text("Transaction ID:", leftX, y);
    doc.setTextColor(0);
    doc.text(c.transaction_id || "N/A", leftX + 30, y);

    // Main Content Box
    y += 20;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, y, 170, 30, "F");

    doc.setFontSize(12);
    doc.text("Description", 25, y + 10);
    doc.text("Amount", 160, y + 10);

    y += 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Farewell Contribution", 25, y);
    doc.text(`Rs. ${c.amount}`, 160, y);

    // Footer
    y += 40;
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);

    doc.setFontSize(16);
    doc.setTextColor(0, 100, 0); // Green
    doc.text("PAID", 160, y + 10);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer generated receipt.", 105, 280, {
      align: "center",
    });

    // Save
    doc.save(`Receipt-${c.id.slice(0, 8)}.pdf`);
  }

  return (
    <Button variant={variant} size={size} onClick={generatePDF}>
      {children || (
        <>
          <Download className={size === "icon" ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          {size !== "icon" && "Receipt"}
        </>
      )}
    </Button>
  );
}
