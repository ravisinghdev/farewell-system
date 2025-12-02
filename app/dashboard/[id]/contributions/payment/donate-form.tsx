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
} from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";

interface DonateFormProps {
  farewellId: string;
  initialAmount: number;
  assignedAmount: number;
  paidAmount: number;
  recentTransactions: any[];
}

export function DonateForm({
  farewellId,
  initialAmount,
  assignedAmount,
  paidAmount,
  recentTransactions,
}: DonateFormProps) {
  const [amount, setAmount] = useState(
    initialAmount > 0 ? initialAmount.toString() : ""
  );
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

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

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
          },
          theme: {
            color: "#000000",
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

  return (
    <div className="max-w-md mx-auto space-y-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Processing/Verifying Dialog */}
      <Dialog
        open={status !== "idle"}
        onOpenChange={(open) => !open && setStatus("idle")}
      >
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white [&>button]:hidden">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
            <DialogTitle className="text-xl font-bold">
              {status === "verifying"
                ? "Verifying Payment"
                : "Processing Payment"}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-center">
              {status === "verifying"
                ? "Please wait while we verify your transaction..."
                : "Please wait while we initiate the payment securely."}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2">
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

      {/* Error Dialog */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Payment Failed
            </DialogTitle>
            <DialogDescription className="text-white/60 text-center max-w-xs">
              {errorMessage}
            </DialogDescription>
            <Button
              className="w-full mt-4 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setShowError(false)}
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GlassCard className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Make a Contribution
          </h2>
          <p className="text-white/60">
            Your assigned amount is{" "}
            <span className="text-white font-bold">₹{assignedAmount}</span>
          </p>
          {paidAmount > 0 && (
            <p className="text-emerald-400 text-sm mt-1">
              You have already paid ₹{paidAmount}
            </p>
          )}
        </div>

        <form onSubmit={handleDonate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Enter Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-12 bg-white/5 border-white/10 text-white text-lg font-bold placeholder:text-white/20 focus:border-white/30 transition-all"
                placeholder="0"
                min="1"
              />
            </div>
            {assignedAmount > 0 && (
              <div className="flex justify-between text-xs text-white/40 px-1">
                <span>Min: ₹1</span>
                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      Math.max(0, assignedAmount - paidAmount).toString()
                    )
                  }
                  className="text-white/60 hover:text-white underline"
                >
                  Pay Remaining (₹{Math.max(0, assignedAmount - paidAmount)})
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={
              isPending || status !== "idle" || !amount || Number(amount) <= 0
            }
            className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isPending || status !== "idle" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Proceed to Pay <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
            <CreditCard className="w-3 h-3" />
            <span>Secured by Razorpay</span>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
