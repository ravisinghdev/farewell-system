"use client";

import { useState, useTransition } from "react";
import {
  createOrderAction,
  verifyPaymentAction,
} from "@/app/actions/razorpay-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Wallet,
  ArrowLeft,
  ChevronRight,
  Banknote,
  Building,
} from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface DonateFormProps {
  farewellId: string;
  initialAmount: number;
  assignedAmount: number;
  paidAmount: number;
  recentTransactions: any[];
}

type PaymentStep = "amount" | "method" | "confirm";

export function DonateForm({
  farewellId,
  initialAmount,
  assignedAmount,
  paidAmount,
  recentTransactions,
}: DonateFormProps) {
  const [step, setStep] = useState<PaymentStep>("amount");
  const [amount, setAmount] = useState(
    initialAmount > 0 ? initialAmount.toString() : ""
  );
  const [method, setMethod] = useState<"upi" | "cash" | "bank">("upi");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "processing" | "verifying">(
    "idle"
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastContributionId, setLastContributionId] = useState<string | null>(
    null
  );

  const router = useRouter();

  // Listen for changes in contributions table for this farewell
  useRealtimeSubscription({
    table: "contributions",
    filter: `farewell_id=eq.${farewellId}`,
  });

  const handleNextStep = () => {
    if (step === "amount") {
      const val = Number(amount);
      if (!val || val <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      setStep("method");
    } else if (step === "method") {
      setStep("confirm");
    }
  };

  const handleBackStep = () => {
    if (step === "method") setStep("amount");
    if (step === "confirm") setStep("method");
  };

  async function handleDonate() {
    const val = Number(amount);

    // For now, we only implement Razorpay flow for UPI/Cards as standard
    // If Cash/Bank is selected, we might want a different flow (e.g. manual record creation)
    // But based on current backend, let's assume Razorpay handles the flow or we strictly use Razorpay for now.
    // If the requirement implies "Manual Cash Entry", that requires a new Backend Action.
    // Assuming Standard Razorpay for now based on props availability.

    setStatus("processing");

    startTransition(async () => {
      try {
        const result = await createOrderAction(farewellId, val);

        if (result.error || !result.orderId || !result.keyId) {
          setStatus("idle");
          setErrorMessage(result.error || "Failed to create order");
          setShowError(true);
          return;
        }

        if (!(window as any).Razorpay) {
          setStatus("idle");
          setErrorMessage("Razorpay SDK not loaded. Please refresh.");
          setShowError(true);
          return;
        }

        const options = {
          key: result.keyId,
          amount: result.amount,
          currency: result.currency,
          name: "Farewell Contribution",
          description: "Contribution Payment",
          order_id: result.orderId,
          handler: async function (response: any) {
            setStatus("verifying");

            // Verify payment on server
            const verifyResult = await verifyPaymentAction(
              farewellId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              val
            );

            setStatus("idle");

            if (verifyResult.success) {
              setShowSuccess(true);
              if (verifyResult.contributionId) {
                setLastContributionId(verifyResult.contributionId);
              }
              // @ts-ignore
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
              router.refresh();
            } else {
              setErrorMessage(
                verifyResult.error || "Payment verification failed"
              );
              setShowError(true);
            }
          },
          prefill: {
            name: "User", // We could pass user details here if needed
            contact: "",
            email: "",
          },
          theme: {
            color: "#10b981", // Emerald-500
          },
          modal: {
            ondismiss: function () {
              setStatus("idle");
            },
          },
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
      } catch (err: any) {
        setStatus("idle");
        setErrorMessage(err.message || "Something went wrong");
        setShowError(true);
      }
    });
  }

  const steps = [
    { id: "amount", label: "Amount" },
    { id: "method", label: "Method" },
    { id: "confirm", label: "Confirm" },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        {steps.map((s, i) => {
          const isActive = s.id === step;
          const isPast = steps.findIndex((st) => st.id === step) > i;

          return (
            <div
              key={s.id}
              className="flex flex-col items-center gap-2 relative z-10"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110"
                    : isPast
                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50"
                    : "bg-white/5 text-muted-foreground border border-white/10"
                )}
              >
                {isPast ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
        {/* Progress Bar Line */}
        <div className="absolute top-[28px] left-[calc(50%-100px)] w-[200px] h-[2px] bg-white/5 -z-0">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width:
                step === "amount" ? "0%" : step === "method" ? "50%" : "100%",
            }}
          />
        </div>
      </div>

      <GlassCard className="p-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />

        {/* STEP 1: AMOUNT */}
        {step === "amount" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">How much?</h2>
              <p className="text-muted-foreground text-sm">
                Enter the amount you wish to contribute.
              </p>
            </div>

            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xl group-focus-within:text-primary transition-colors">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 h-20 bg-black/20 border-white/10 text-4xl font-bold placeholder:text-muted-foreground/20 focus:border-primary/50 transition-all text-center rounded-2xl"
                placeholder="0"
                min="1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium transition-colors"
                >
                  ₹{val}
                </button>
              ))}
            </div>

            {assignedAmount > 0 && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-xs text-blue-400 mb-1">Assigned Goal</p>
                <p className="text-lg font-bold text-blue-300">
                  ₹{assignedAmount}
                </p>
                <button
                  onClick={() =>
                    setAmount(
                      Math.max(0, assignedAmount - paidAmount).toString()
                    )
                  }
                  className="text-[10px] uppercase tracking-wider font-bold text-blue-400/80 hover:text-blue-400 mt-1"
                >
                  Pay Remaining (₹{Math.max(0, assignedAmount - paidAmount)})
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: METHOD */}
        {step === "method" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Payment Method</h2>
              <p className="text-muted-foreground text-sm">
                Choose how you want to pay.
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setMethod("upi")}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group hover:scale-[1.02]",
                  method === "upi"
                    ? "bg-primary/10 border-primary/50"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    method === "upi"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-bold",
                      method === "upi" ? "text-primary" : "text-foreground"
                    )}
                  >
                    UPI / QR Code
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pay via GPay, PhonePe, Paytm
                  </p>
                </div>
                {method === "upi" && (
                  <CheckCircle2 className="w-5 h-5 ml-auto text-primary" />
                )}
              </button>

              <button
                onClick={() => setMethod("cash")}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group hover:scale-[1.02] opacity-50 cursor-not-allowed",
                  method === "cash"
                    ? "bg-amber-500/10 border-amber-500/50"
                    : "bg-white/5 border-white/5"
                )}
                disabled
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    method === "cash"
                      ? "bg-amber-500 text-black"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-bold",
                      method === "cash" ? "text-amber-500" : "text-foreground"
                    )}
                  >
                    Cash Payment
                  </h3>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === "confirm" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Confirm Payment</h2>
              <p className="text-muted-foreground text-sm">
                Review details before proceeding.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold text-foreground">
                  ₹{amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Method</span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <QrCode className="w-4 h-4" /> UPI / Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Transaction Fee
                </span>
                <span className="text-sm font-medium text-emerald-400">
                  ₹0 (Free)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          {step !== "amount" && (
            <Button
              variant="outline"
              onClick={handleBackStep}
              className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}

          {step === "confirm" ? (
            <Button
              onClick={handleDonate}
              disabled={isPending || status !== "idle"}
              className="flex-[2] h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Pay Now"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              className="flex-[2] h-12 rounded-xl bg-white text-black font-bold hover:bg-white/90"
            >
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </GlassCard>

      {/* FOOTER TEXT */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-6 opacity-60">
        <CreditCard className="w-3 h-3" />
        <span>Secured by Razorpay. 100% Safe Transaction.</span>
      </div>

      {/* Processing/Verifying Dialog */}
      <Dialog
        open={status !== "idle"}
        onOpenChange={(open) => !open && setStatus("idle")}
      >
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white [&>button]:hidden">
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
            </div>
            <div className="space-y-2 text-center">
              <DialogTitle className="text-2xl font-bold">
                {status === "verifying"
                  ? "Verifying Payment..."
                  : "Processing..."}
              </DialogTitle>
              <DialogDescription className="text-white/60 text-center">
                {status === "verifying"
                  ? "Checking payment status with bank."
                  : "Please complete the payment in the popup."}
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Payment Successful!
            </DialogTitle>
            <DialogDescription className="text-white/60 text-center max-w-xs">
              Thank you for your contribution of{" "}
              <span className="text-white font-bold">₹{amount}</span>. Your
              payment is now <strong>pending admin verification</strong>. You
              will be notified once approved.
            </DialogDescription>
            <div className="flex flex-col w-full gap-2 mt-4">
              <Button
                className="w-full bg-white text-black hover:bg-white/90"
                onClick={() => {
                  setShowSuccess(false);
                  if (lastContributionId) {
                    router.push(
                      `/dashboard/${farewellId}/contributions/receipt/${lastContributionId}`
                    );
                  } else {
                    router.push(
                      `/dashboard/${farewellId}/contributions/overview`
                    );
                  }
                }}
              >
                View Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent border-white/10 text-white hover:bg-white/5"
                onClick={() => {
                  setShowSuccess(false);
                  router.push(
                    `/dashboard/${farewellId}/contributions/overview`
                  );
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog with Support Options */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Payment Issue
            </DialogTitle>
            <DialogDescription className="text-white/60 text-center max-w-xs">
              {errorMessage}
            </DialogDescription>

            <div className="w-full p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <p className="text-xs text-white/40 text-center uppercase tracking-wider">
                Troubleshooting Steps
              </p>
              <ul className="text-sm text-white/80 space-y-1 list-disc pl-4">
                <li>Check your internet connection.</li>
                <li>Ensure your bank account has sufficient funds.</li>
                <li>
                  If money was deducted, <strong>do not pay again</strong>.
                </li>
              </ul>
            </div>

            <div className="flex flex-col w-full gap-2 mt-4">
              <Button
                className="w-full bg-white text-black hover:bg-white/90"
                onClick={() => setShowError(false)}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5"
                onClick={() => {
                  window.open(
                    `mailto:support@farewell.com?subject=Payment Issue&body=Ref ID: ${
                      lastContributionId || "N/A"
                    }`,
                    "_blank"
                  );
                }}
              >
                Contact Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Dialog (Panic Button) */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="mx-auto flex items-center gap-2 text-white/40 hover:text-white hover:bg-white/5 text-xs mt-4"
          >
            <AlertCircle className="w-3 h-3" />
            Having trouble?
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
          <DialogTitle>Payment Support</DialogTitle>
          <DialogDescription className="text-white/60">
            Common solutions for payment issues.
          </DialogDescription>

          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Money Deducted?
              </h4>
              <p className="text-sm text-blue-200/80">
                Don't panic! If money was deducted but not reflected here, it is
                safe with your bank. It will be{" "}
                <strong>automatically refunded</strong> within 24-48 hours.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-bold text-white mb-1">UPI Payment Stuck?</h4>
              <p className="text-sm text-white/60">
                Wait for 5-10 minutes. Sometimes banks take longer to confirm
                transactions. You can check the status again later.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
