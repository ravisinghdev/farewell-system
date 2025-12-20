"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  createOrderAction,
  verifyPaymentAction,
} from "@/app/actions/razorpay-actions";
import { createContributionAction } from "@/app/actions/contribution-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowLeft,
  ChevronRight,
  Upload,
  Smartphone,
  Sparkles,
  TrendingUp,
  History,
  Banknote,
  Lock,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
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
import { formatDistanceToNow } from "date-fns";

interface DonateFormProps {
  farewellId: string;
  initialAmount: number;
  assignedAmount: number;
  paidAmount: number;
  publicTransactions: any[];
  initialSettings?: any;
}

type PaymentStep = "amount" | "method" | "confirm";

export function DonateForm({
  farewellId,
  initialAmount,
  assignedAmount,
  paidAmount,
  publicTransactions,
  initialSettings,
}: DonateFormProps) {
  const [step, setStep] = useState<PaymentStep>("amount");
  const [amount, setAmount] = useState(
    initialAmount > 0 ? initialAmount.toString() : ""
  );
  const [method, setMethod] = useState<"upi" | "manual_upi" | "cash">("upi");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "processing" | "verifying">(
    "idle"
  );

  // Real-time Settings State
  const [settings, setSettings] = useState(
    initialSettings || {
      accepting_payments: true,
      is_maintenance_mode: false,
      payment_config: { upi: true, cash: true, upi_id: "" },
    }
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastContributionId, setLastContributionId] = useState<string | null>(
    null
  );
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Listen for changes in contributions table for this farewell
  useRealtimeSubscription({
    table: "contributions",
    filter: `farewell_id=eq.${farewellId}`,
  });

  // Additional Realtime Listener for Settings (Admin Changes)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("donate-settings-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "farewells",
          filter: `id=eq.${farewellId}`,
        },
        (payload) => {
          const newData = payload.new;
          if (newData) {
            setSettings((prev: any) => ({
              ...prev,
              accepting_payments: newData.accepting_payments,
              is_maintenance_mode: newData.is_maintenance_mode,
              payment_config: newData.payment_config,
            }));
            toast.info("Collection settings updated by admin");
            router.refresh(); // Refresh page data too
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, router]);

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

  const handleManualSubmit = async () => {
    if (!transactionId) {
      toast.error("Please enter a Transaction ID");
      return;
    }

    setStatus("processing");
    startTransition(async () => {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("method", "upi"); // Backend expects 'upi' for manual too
      formData.append("farewellId", farewellId);
      formData.append("transactionId", transactionId);
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const result = await createContributionAction(formData);

      setStatus("idle");

      if (result.success) {
        setShowSuccess(true);
        router.refresh();
        // @ts-ignore
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        console.error(result.error);
        setErrorMessage(
          (result.error as string) || "Failed to submit contribution"
        );
        setShowError(true);
      }
    });
  };

  async function handleDonate() {
    if (method === "manual_upi") {
      handleManualSubmit();
      return;
    }

    const val = Number(amount);

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
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI / Apps",
                  instruments: [
                    {
                      method: "upi",
                    },
                  ],
                },
                other: {
                  name: "Other Payment Methods",
                  instruments: [
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                  ],
                },
              },
              sequence: ["block.upi", "block.other"],
              preferences: {
                show_default_blocks: false,
              },
            },
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

  // --- Maintenance / Closed Check ---
  if (settings.is_maintenance_mode) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[500px]">
        <GlassCard className="p-8 max-w-md text-center border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/5">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-500">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Under Maintenance
          </h2>
          <p className="text-muted-foreground">
            Contributions are temporarily paused for maintenance. Please check
            back later.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!settings.accepting_payments) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[500px]">
        <GlassCard className="p-8 max-w-md text-center border-red-500/20 bg-red-500/10 dark:bg-red-500/5">
          <div className="w-16 h-16 rounded-full bg-red-500/20 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Contributions Closed
          </h2>
          <p className="text-muted-foreground">
            New contributions are no longer being accepted for this farewell.
            Thank you for your support!
          </p>
        </GlassCard>
      </div>
    );
  }

  const steps = [
    { id: "amount", label: "Amount" },
    { id: "method", label: "Method" },
    { id: "confirm", label: "Confirm" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* LEFT SIDE: Payment Form (Span 7) */}
      <div className="lg:col-span-7 space-y-8 w-full">
        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, i) => {
            const isActive = s.id === step;
            const isPast = steps.findIndex((st) => st.id === step) > i;

            return (
              <div
                key={s.id}
                className="flex flex-col items-center gap-2 relative z-10 group cursor-pointer"
                onClick={() => {
                  if (isPast) setStep(s.id as PaymentStep);
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                    isActive
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110"
                      : isPast
                      ? "bg-emerald-500 text-black border-emerald-500 hover:scale-105"
                      : "bg-black/40 text-white/30 border-white/10"
                  )}
                >
                  {isPast ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-colors",
                    isActive ? "text-white" : "text-white/40"
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
          {/* Progress Bar Line */}
          <div className="absolute top-[20px] left-[50px] right-[50px] lg:left-[calc(50%-150px)] lg:w-[300px] h-[2px] bg-white/10 -z-0 hidden md:block">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{
                width:
                  step === "amount" ? "0%" : step === "method" ? "50%" : "100%",
              }}
            />
          </div>
        </div>

        <GlassCard className="p-0 relative overflow-hidden border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/60 backdrop-blur-2xl min-h-[500px] flex flex-col">
          {/* Animated Glows */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="p-8 border-b border-zinc-100 dark:border-white/5 bg-white/[0.02]">
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              {step === "amount" && (
                <>
                  <Sparkles className="w-6 h-6 text-amber-400" /> Choose
                  Contribution
                </>
              )}
              {step === "method" && (
                <>
                  <CreditCard className="w-6 h-6 text-blue-400" /> Select Method
                </>
              )}
              {step === "confirm" && (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Confirm
                  Payment
                </>
              )}
            </h2>
            <p className="text-muted-foreground text-sm">
              {step === "amount" &&
                "Every contribution counts towards making this farewell memorable."}
              {step === "method" &&
                "Secure payment gateways powered by Razorpay."}
              {step === "confirm" &&
                "Review your contribution details before proceeding."}
            </p>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            {/* STEP 1: AMOUNT */}
            {step === "amount" && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="relative group max-w-sm mx-auto">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-3xl group-focus-within:text-foreground transition-colors">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-14 h-24 bg-zinc-100 dark:bg-black/40 border-zinc-200 dark:border-white/10 text-5xl font-bold text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 transition-all text-center rounded-3xl"
                    placeholder="0"
                    min="1"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className="relative px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/5 hover:border-emerald-500/50 dark:hover:border-white/20 transition-all group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 dark:via-white/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <span className="text-lg font-bold text-foreground">
                        ₹{val}
                      </span>
                    </button>
                  ))}
                </div>

                {assignedAmount > 0 && (
                  <div
                    className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between group cursor-pointer hover:bg-indigo-500/20 transition-colors"
                    onClick={() =>
                      setAmount(
                        Math.max(0, assignedAmount - paidAmount).toString()
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-200 font-bold uppercase tracking-wider">
                          Assigned Goal
                        </p>
                        <p className="text-sm text-indigo-600/60 dark:text-indigo-200/60">
                          Tap to pay remaining
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        ₹{Math.max(0, assignedAmount - paidAmount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: METHOD */}
            {step === "method" && (
              <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="grid gap-4">
                  {/* Razorpay Option - Explicitly enabled or default */}
                  {settings.payment_config?.upi !== false && (
                    <button
                      onClick={() => setMethod("upi")}
                      className={cn(
                        "flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left group hover:scale-[1.01] relative overflow-hidden",
                        method === "upi"
                          ? "bg-white dark:bg-zinc-100 text-black border-zinc-200 dark:border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                          : "bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                          method === "upi"
                            ? "bg-black text-white"
                            : "bg-white/10 text-white/60"
                        )}
                      >
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 text-foreground">
                          Pay Online (Razorpay)
                        </h3>
                        <p
                          className={cn(
                            "text-sm",
                            method === "upi"
                              ? "text-zinc-600 dark:text-black/60"
                              : "text-muted-foreground"
                          )}
                        >
                          Instant verification. UPI Apps, Cards, Netbanking.
                          Fast & Secure.
                        </p>
                      </div>
                      {method === "upi" && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                          <CheckCircle2
                            className="w-8 h-8 text-black"
                            fill="white"
                          />
                        </div>
                      )}
                    </button>
                  )}

                  {/* Manual UPI / Cash Option */}
                  {settings.payment_config?.cash !== false && (
                    <button
                      onClick={() => setMethod("manual_upi")}
                      className={cn(
                        "flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left group hover:scale-[1.01] relative overflow-hidden",
                        method === "manual_upi"
                          ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                          : "bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                          method === "manual_upi"
                            ? "bg-white/20 text-white"
                            : "bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-white/60"
                        )}
                      >
                        <Smartphone className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 text-foreground">
                          Direct UPI / Scan
                        </h3>
                        <p
                          className={cn(
                            "text-sm",
                            method === "manual_upi"
                              ? "text-white/80"
                              : "text-muted-foreground"
                          )}
                        >
                          Scan QR manually via GPay/PhonePe and upload a
                          receipt.
                        </p>
                      </div>
                      {method === "manual_upi" && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: CONFIRM */}
            {step === "confirm" && (
              <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                {method === "manual_upi" ? (
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="p-6 bg-white dark:bg-zinc-100 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="bg-black/5 p-4 rounded-2xl mb-4">
                          <QrCode className="w-32 h-32 text-black" />
                        </div>
                        <p className="text-black font-mono font-bold text-lg bg-black/10 px-4 py-2 rounded-lg break-all">
                          {settings.payment_config?.upi_id || "scanner@ybl"}
                        </p>
                        <p className="text-black/40 text-xs mt-3 uppercase font-bold tracking-widest">
                          Scan with any UPI App
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Transaction ID
                        </label>
                        <Input
                          placeholder="Enter 12-digit UTR"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 h-12 rounded-xl text-foreground font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Proof of Payment
                        </label>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border border-dashed border-zinc-300 dark:border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group h-24"
                        >
                          {screenshot ? (
                            <div className="flex items-center gap-2 text-emerald-500">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {screenshot.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                              <span className="text-xs text-muted-foreground">
                                Upload Screenshot
                              </span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0])
                              setScreenshot(e.target.files[0]);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-6">
                    <div className="flex justify-between items-center pb-6 border-b border-zinc-200 dark:border-white/5">
                      <span className="text-muted-foreground text-lg">
                        Total Amount
                      </span>
                      <span className="text-4xl font-bold text-foreground">
                        ₹{Number(amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="text-foreground font-medium flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Razorpay Secure
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Processing Fee
                        </span>
                        <span className="text-emerald-500 font-medium">
                          ₹0 (Waived)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 flex gap-4">
            {step !== "amount" && (
              <Button
                variant="outline"
                onClick={handleBackStep}
                className="h-14 px-8 rounded-2xl border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 bg-transparent text-foreground"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
            )}

            {step === "confirm" ? (
              <Button
                onClick={handleDonate}
                disabled={isPending || status !== "idle"}
                className={cn(
                  "flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg transition-all transform active:scale-95",
                  method === "manual_upi"
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-black/10"
                )}
              >
                {isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : method === "manual_upi" ? (
                  "Submit Verification"
                ) : (
                  "Pay Now"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-bold hover:bg-primary/90 shadow-lg shadow-black/10 transition-all transform active:scale-95"
              >
                Continue <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}
          </div>
        </GlassCard>
      </div>

      {/* RIGHT SIDE: Impact Board (Span 5) */}
      <div className="lg:col-span-5 h-full space-y-6">
        <GlassCard className="h-full relative overflow-hidden border-zinc-200 dark:border-white/10 bg-gradient-to-b from-white to-zinc-50 dark:from-[#0a0a0a]/80 dark:to-[#0a0a0a]/40 backdrop-blur-3xl rounded-3xl flex flex-col">
          <div className="p-8 border-b border-zinc-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" /> Live Feed
              </h3>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
              Recent contributions from the community
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] p-6 space-y-4 custom-scrollbar">
            {publicTransactions && publicTransactions.length > 0 ? (
              publicTransactions.map((tx, i) => {
                const isAnonymous = !tx.users;
                const name = isAnonymous
                  ? "Anonymous"
                  : tx.users?.full_name || "User";
                const avatar = tx.users?.avatar_url;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors group animate-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-zinc-200 dark:ring-white/10">
                          {name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-foreground font-bold text-sm group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors">
                          {name}
                        </p>
                        <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                          {formatDistanceToNow(new Date(tx.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-sm">
                        +₹{Number(tx.amount).toLocaleString()}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          tx.status === "verified" || tx.status === "approved"
                            ? "text-emerald-500/60"
                            : "text-amber-500/60"
                        )}
                      >
                        {tx.status}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 opacity-50">
                <History className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/40 text-sm">No recent transactions</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Panic Button */}
        <div className="text-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-white/20 hover:text-white/60 hover:bg-transparent text-xs"
              >
                <AlertCircle className="w-3 h-3" />
                Having trouble payment?
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
                  <p className="text-xs text-blue-200/80">
                    Do not pay again. Wait for 15 minutes, or contact admin with
                    your Transaction ID.
                  </p>
                </div>
                <Button
                  className="w-full bg-white text-black"
                  onClick={() => window.open(`mailto:support@farewell.com`)}
                >
                  Contact Admin
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Processing/Verifying Dialog */}
      <Dialog
        open={status !== "idle"}
        onOpenChange={(open) => !open && setStatus("idle")}
      >
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white [&>button]:hidden backdrop-blur-xl">
          <div className="flex flex-col items-center justify-center py-10 space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative z-10 w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <CreditCard className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                {status === "verifying" ? "Verifying Payment" : "Processing"}
              </DialogTitle>
              <DialogDescription className="text-white/60 text-center max-w-xs mx-auto text-base">
                {method === "manual_upi"
                  ? "Securely submitting your payment details..."
                  : status === "verifying"
                  ? "Checking status with bank..."
                  : "Please complete the payment in the popup."}
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white backdrop-blur-xl">
          {/* Confetti should happen here */}
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-3xl font-bold text-white">
                Payment Submitted!
              </DialogTitle>
              <DialogDescription className="text-white/60 text-center max-w-xs mx-auto">
                Thank you for your contribution of{" "}
                <span className="text-emerald-400 font-bold text-lg">
                  ₹{amount}
                </span>
                .
              </DialogDescription>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-full text-center">
              <p className="text-sm text-emerald-300">
                Your payment is now pending verification. You'll be notified
                once approved.
              </p>
            </div>

            <div className="flex flex-col w-full gap-3 mt-4">
              <Button
                className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold shadow-lg shadow-white/10"
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
              Payment Issue
            </DialogTitle>
            <DialogDescription className="text-white/60 text-center max-w-xs">
              {errorMessage}
            </DialogDescription>

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
    </div>
  );
}
