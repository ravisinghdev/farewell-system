"use client";

import { useState, useEffect, useRef } from "react";
import { usePaymentForm } from "@/hooks/use-payment-form";
import { getUpiConfigAction } from "@/app/actions/upi-actions";
import { createGatewayOrderAction } from "@/app/actions/gateway-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode as QrCodeIcon,
  ArrowLeft,
  ChevronRight,
  Upload,
  Smartphone,
  Sparkles,
  Lock,
  Download,
  PartyPopper,
  CreditCard,
  Globe,
  Clock, // Added
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InvoiceButton } from "@/components/admin/gateway/invoice-button";

interface DonateFormProps {
  farewellId: string;
  initialAmount: number;
  assignedAmount: number;
  paidAmount: number;
  verifiedAmount: number;
  pendingAmount: number;
  // publicTransactions removed in favor of slot
  sidebar: React.ReactNode;
  initialSettings?: any;
}

export function DonateForm({
  farewellId,
  initialAmount,
  assignedAmount,
  paidAmount,
  verifiedAmount,
  pendingAmount,
  sidebar,
  initialSettings,
}: DonateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for successful return from gateway
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
      });
      // Clear param
      router.replace(`/dashboard/${farewellId}/contributions/payment`);
    }
  }, [searchParams, router, farewellId]);

  // Settings state
  const [settings, setSettings] = useState(
    initialSettings || {
      accepting_payments: true,
      is_maintenance_mode: false,
      payment_config: { upi: true, upi_id: null },
    }
  );
  const [upiConfig, setUpiConfig] = useState<{ upiId: string } | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Dialogs
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Logic for Assigned vs Extra
  const [isExtraContribution, setIsExtraContribution] = useState(false);

  // LOGIC BLOCK
  const remainingAmount = Math.max(0, assignedAmount - paidAmount);
  // Goal is met if total paid (including pending) >= assigned
  const isGoalMet = assignedAmount > 0 && remainingAmount <= 0;

  // Show "All Set" ONLY if verified amount covers the assigned amount
  const isVerifiedComplete =
    assignedAmount > 0 && verifiedAmount >= assignedAmount;

  // Show "Pending" if goal met but not fully verified
  const isPendingVerification = isGoalMet && !isVerifiedComplete;

  // If user wants to pay extra, we ignore the "assigned" constraint
  const effectiveAssignedAmount = isExtraContribution ? 0 : remainingAmount;
  // If verifying goal met, ensure we aren't in extra mode
  const shouldShowGoalMet =
    (isVerifiedComplete || isPendingVerification) && !isExtraContribution;

  // Payment form hook
  const paymentForm = usePaymentForm({
    farewellId,
    initialAmount: effectiveAssignedAmount || initialAmount,
    onSuccess: () => {
      setShowSuccess(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
      });
    },
  });

  // Force amount to be remaining amount ONLY when switching modes
  useEffect(() => {
    if (!isExtraContribution && remainingAmount > 0) {
      paymentForm.setAmount(remainingAmount.toString());
    } else if (isExtraContribution) {
      // When switching to extra, clear or set default if needed.
      // Let's leave it as is or set to empty to let them type.
      // actually, just don't force it if they are already typing.
      // simplified: just run this when mode changes.
      if (paymentForm.amount === remainingAmount.toString()) {
        paymentForm.setAmount("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExtraContribution]);

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  async function handleGatewayCheckout() {
    setIsCreatingOrder(true);
    const res = await createGatewayOrderAction(
      farewellId,
      Number(paymentForm.amount)
    );
    if (res.error) {
      setErrorMessage(res.error);
      setShowError(true);
      setIsCreatingOrder(false);
    } else if (res.redirectUrl) {
      router.push(res.redirectUrl);
    }
  }

  // Realtime & Settings effects ...
  useRealtimeSubscription({
    table: "contributions",
    filter: `farewell_id=eq.${farewellId}`,
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("farewell-settings")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "farewells",
          filter: `id=eq.${farewellId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            setSettings((prev: any) => ({ ...prev, ...newData }));
            toast.info("Payment settings updated");
            router.refresh();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, router]);

  useEffect(() => {
    async function loadUpiConfig() {
      setIsLoadingConfig(true);
      try {
        const result = await getUpiConfigAction(farewellId);
        if (result.success && result.upiId) {
          setUpiConfig({ upiId: result.upiId });
        } else {
          // allow manual checks if no UPI
        }
      } catch (err) {
        console.error("Config load error", err);
      } finally {
        setIsLoadingConfig(false);
      }
    }
    loadUpiConfig();
  }, [farewellId]);

  useEffect(() => {
    if (
      paymentForm.currentStep === "payment" &&
      upiConfig?.upiId &&
      !paymentForm.qrCode
    ) {
      paymentForm.generateQrCode(upiConfig.upiId);
    }
  }, [paymentForm.currentStep, upiConfig, paymentForm]);

  // RENDER BLOCKS

  // VIEW FOR VERIFIED COMPLETE
  if (isVerifiedComplete && !isExtraContribution) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500">
        <div className="text-center space-y-6 max-w-lg mx-auto p-10 bg-white dark:bg-zinc-900 rounded-3xl border shadow-xl">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <PartyPopper className="w-12 h-12" />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">
              You're All Set!
            </h2>
            <p className="text-muted-foreground mt-2">
              You have successfully contributed a total of{" "}
              <span className="font-bold text-foreground">
                ₹{verifiedAmount}
              </span>{" "}
              against your assigned goal of ₹{assignedAmount}.
            </p>
          </div>

          <div className="flex flex-col gap-3 justify-center w-full">
            <InvoiceButton
              contribution={
                {
                  id: "LATEST",
                  amount: verifiedAmount,
                  farewell_id: farewellId,
                  created_at: new Date().toISOString(),
                  status: "verified",
                  user: { full_name: "Me" },
                } as any
              }
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full h-12 text-lg"
            >
              <Download className="mr-2 h-4 w-4" /> Download Receipt
            </InvoiceButton>

            <Button
              variant="outline"
              className="w-full h-12 text-lg border-dashed"
              onClick={() => setIsExtraContribution(true)}
            >
              Make Another Contribution
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW FOR PENDING VERIFICATION
  if (isPendingVerification && !isExtraContribution) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500">
        <div className="text-center space-y-6 max-w-lg mx-auto p-10 bg-white dark:bg-zinc-900 rounded-3xl border border-amber-200 shadow-xl">
          <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Clock className="w-12 h-12" />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Verification Pending
            </h2>
            <p className="text-muted-foreground mt-2">
              You have submitted enough to cover your goal (₹{assignedAmount}).
              <br />
              <span className="text-amber-600 font-medium">
                ₹{pendingAmount}
              </span>{" "}
              is currently under manual review.
            </p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-sm text-left space-y-2">
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Verified: ₹{verifiedAmount}</span>
            </div>
            <div className="flex gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Pending: ₹{pendingAmount}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 justify-center w-full">
            <Button
              disabled
              variant="outline"
              className="w-full h-12 text-lg opacity-50 cursor-not-allowed"
            >
              <Lock className="mr-2 h-4 w-4" /> Receipt Unavailable
            </Button>
            <p className="text-xs text-muted-foreground">
              Receipt will be available once the admin verifies the payment.
            </p>
            <Button
              variant="outline"
              className="w-full h-12 text-lg border-dashed mt-2"
              onClick={() => setIsExtraContribution(true)}
            >
              Make Another Contribution
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (settings.is_maintenance_mode) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-xl font-bold">System Maintenance</h3>
          <p className="text-muted-foreground">
            Payments are temporarily disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      <div className="lg:col-span-8 space-y-8 w-full">
        {/* Simplified Steps */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2",
              paymentForm.currentStep === "amount"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Sparkles className="w-4 h-4" />{" "}
            {isExtraContribution ? "Extra Amount" : "1. Amount"}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2",
              paymentForm.currentStep === "payment"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Smartphone className="w-4 h-4" /> 2. Payment
          </div>
        </div>

        <Card className="min-h-[500px] flex flex-col shadow-lg border-2 border-muted/40">
          <CardHeader className="p-8 border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {paymentForm.currentStep === "amount"
                    ? isExtraContribution
                      ? "Voluntary Contribution"
                      : "Confirm Contribution"
                    : "Complete Payment"}
                </CardTitle>
                <CardDescription>
                  {paymentForm.currentStep === "amount"
                    ? "Review your contribution amount below."
                    : "Choose your preferred payment method."}
                </CardDescription>
              </div>
              {isExtraContribution && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExtraContribution(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>

          <div className="flex-1 p-8">
            {paymentForm.currentStep === "amount" && (
              <div className="max-w-md mx-auto space-y-8">
                {isExtraContribution ? (
                  <div className="relative group mx-auto">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-4xl">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => paymentForm.setAmount(e.target.value)}
                      className="pl-16 h-24 text-5xl font-bold text-center border-dashed"
                      autoFocus
                    />
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Enter any amount you wish to contribute.
                    </p>
                  </div>
                ) : (
                  <div className="relative group mx-auto">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-4xl">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => paymentForm.setAmount(e.target.value)}
                      className="pl-16 h-24 text-5xl font-bold text-center border-dashed"
                      autoFocus
                    />
                    <div className="text-center mt-4 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Current Balance:{" "}
                        <span className="font-bold">₹{remainingAmount}</span>
                      </p>
                      <p
                        className={cn(
                          "text-sm font-medium transition-colors",
                          Math.max(
                            0,
                            remainingAmount - Number(paymentForm.amount || 0)
                          ) === 0
                            ? "text-emerald-600"
                            : "text-amber-600"
                        )}
                      >
                        Remaining after payment: ₹
                        {Math.max(
                          0,
                          remainingAmount - Number(paymentForm.amount || 0)
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {!isExtraContribution && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg text-sm text-amber-800 dark:text-amber-400 flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>
                      Please ensure you pay the exact amount to get verified
                      automatically.
                    </p>
                  </div>
                )}
              </div>
            )}

            {paymentForm.currentStep === "payment" && (
              <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
                {/* Gateway Option - NEW */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase text-muted-foreground">
                    Pay Securely
                  </h4>
                  <Card
                    onClick={handleGatewayCheckout}
                    className="cursor-pointer border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all p-6 flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Globe className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Online Gateway</h3>
                      <p className="text-xs text-muted-foreground">
                        UPI, Cards, Netbanking
                      </p>
                    </div>
                    <Button className="w-full mt-2" disabled={isCreatingOrder}>
                      {isCreatingOrder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Proceed Securely"
                      )}
                    </Button>
                  </Card>
                </div>

                {/* Manual QR Option */}
                <div className="space-y-4 opacity-50 hover:opacity-100 transition-opacity">
                  <h4 className="font-bold text-sm uppercase text-muted-foreground">
                    Or Manual Upload
                  </h4>
                  <div className="p-4 border border-dashed rounded-xl space-y-4">
                    <div className="flex items-center gap-4">
                      <QrCodeIcon className="w-10 h-10 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-semibold">Scan QR manually</p>
                        <p className="text-muted-foreground">
                          Upload screenshot after
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Enter 12-digit UTR"
                        value={paymentForm.transactionId}
                        onChange={(e) =>
                          paymentForm.setTransactionId(e.target.value)
                        }
                        className="font-mono text-sm"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          paymentForm.setScreenshot(e.target.files[0])
                        }
                        className="text-xs"
                      />
                      <Button
                        className="w-full h-8 text-xs"
                        variant="secondary"
                        onClick={() => paymentForm.submitPayment()}
                        disabled={paymentForm.isSubmitting}
                      >
                        {paymentForm.isSubmitting
                          ? "Verifying..."
                          : "Verify Manually"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <CardFooter className="p-8 border-t bg-muted/5 flex justify-between">
            {paymentForm.currentStep === "payment" && (
              <Button variant="outline" onClick={paymentForm.goToPreviousStep}>
                Back
              </Button>
            )}

            {paymentForm.currentStep === "amount" && (
              <Button
                className="w-full text-lg h-12"
                onClick={paymentForm.goToNextStep}
              >
                Select Payment Method <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="lg:col-span-4">
        <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
        <div className="space-y-3">{sidebar}</div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <DialogTitle className="text-2xl font-bold mb-2">
              Payment Submitted!
            </DialogTitle>
            <DialogDescription>
              Your contribution of ₹{paymentForm.amount} is successful.
            </DialogDescription>
            <Button
              className="mt-6 w-full"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
