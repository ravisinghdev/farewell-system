"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, QrCode, Building2, CheckCircle2 } from "lucide-react";
import { processPublicPaymentAction } from "@/app/actions/payment-actions";
import Image from "next/image";

interface PaymentCheckoutFormProps {
  link: any;
}

export function PaymentCheckoutForm({ link }: PaymentCheckoutFormProps) {
  const [step, setStep] = useState<"method" | "pay" | "verify" | "success">(
    "method"
  );
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    transactionId: "",
  });

  // Mock UPI Data (In a real app, this would come from connection settings)
  const upiId = "ravisingh55v@ptyes";
  const upiUrl = `upi://pay?pa=${upiId}&pn=Farewell&am=${link.amount}&tn=${
    link.slug || "Payment"
  }`;

  // Use a simple public QR API for demo (or use the one from user props)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiUrl
  )}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.transactionId)
      return toast.error("Transaction ID is required");

    setLoading(true);

    // 1. Upload logic would go here (omitted for brevity, assume URL or handle in action)
    // For this prototype, we'll fake the upload or use a placeholder if no backend upload ready
    const fakeScreenshotUrl = "https://placehold.co/600x400/png?text=Receipt";

    const result = await processPublicPaymentAction({
      paymentLinkId: link.id,
      amount: link.amount,
      transactionId: formData.transactionId,
      screenshotUrl: fakeScreenshotUrl, // In real app, upload to storage first
      farewellId: link.farewell_id,
    });

    setLoading(false);

    if (result.success) {
      setStep("success");
    } else {
      toast.error(result.error || "Payment failed");
    }
  }

  if (step === "success") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Payment Submitted!
        </h3>
        <p className="text-neutral-400 mb-6">
          Your payment of ₹{link.amount} is under verification. You will receive
          a confirmation shortly.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          Make Another Payment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Steps Navigation (Visual Only) */}
      <div className="flex justify-between mb-8 px-2">
        {["Select", "Pay", "Verify"].map((s, i) => {
          const currentStepIndex = ["method", "pay", "verify"].indexOf(step);
          const isActive = i <= currentStepIndex;
          return (
            <div
              key={s}
              className={`text-xs font-medium ${
                isActive ? "text-blue-400" : "text-neutral-600"
              }`}
            >
              {s}
            </div>
          );
        })}
      </div>

      {step === "method" && (
        <div className="space-y-3">
          <button
            onClick={() => setStep("pay")}
            className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg flex items-center gap-4 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-neutral-200">UPI / QR Code</h3>
              <p className="text-xs text-neutral-400">
                GooglePay, PhonePe, Paytm
              </p>
            </div>
          </button>

          <button
            onClick={() => setStep("pay")}
            className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg flex items-center gap-4 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-neutral-200">Bank Transfer</h3>
              <p className="text-xs text-neutral-400">IMPS / NEFT</p>
            </div>
          </button>
        </div>
      )}

      {step === "pay" && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto bg-white p-2 rounded-lg mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Payment QR"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-sm text-neutral-400 font-mono bg-neutral-800 py-2 px-4 rounded inline-block">
              {upiId}
            </p>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => setStep("verify")}
          >
            I Have Paid
          </Button>
          <Button
            variant="ghost"
            className="w-full text-neutral-500"
            onClick={() => setStep("method")}
          >
            Back
          </Button>
        </div>
      )}

      {step === "verify" && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 animate-in slide-in-from-right duration-300"
        >
          <div className="space-y-2">
            <Label className="text-neutral-300">Transaction ID (UTR)</Label>
            <Input
              placeholder="e.g. 439201..."
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              value={formData.transactionId}
              onChange={(e) =>
                setFormData({ ...formData, transactionId: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Upload Screenshot</Label>
            <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center hover:bg-neutral-800/50 transition-colors cursor-pointer">
              <input
                type="file"
                className="hidden"
                id="screenshot"
                accept="image/*"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="screenshot" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                <span className="text-xs text-neutral-400">
                  {uploadedFile
                    ? uploadedFile.name
                    : "Click to upload payment receipt"}
                </span>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit for Verification"
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-neutral-500"
            type="button"
            onClick={() => setStep("pay")}
          >
            Back
          </Button>
        </form>
      )}
    </div>
  );
}
