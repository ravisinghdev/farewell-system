"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createContributionAction } from "@/app/actions/contribution-actions";
import { getFarewellAssignedAmountAction } from "@/app/actions/dashboard-actions";
import { Loader2, Plus, Upload, QrCode, Building2, Wallet } from "lucide-react";

interface AddContributionDialogProps {
  farewellId: string;
}

export function AddContributionDialog({
  farewellId,
}: AddContributionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingAmount, setLoadingAmount] = useState(false); // New state
  const [step, setStep] = useState<"amount" | "method" | "pay" | "verify">(
    "amount"
  );
  const [data, setData] = useState({
    amount: "",
    method: "upi",
    transactionId: "",
  });

  // Fetch Assigned Amount on Open
  useEffect(() => {
    if (open) {
      async function loadAmount() {
        setLoadingAmount(true);
        const res = await getFarewellAssignedAmountAction(farewellId);
        if (res.amount) {
          setData((prev) => ({ ...prev, amount: res.amount }));
        }
        setLoadingAmount(false);
      }
      loadAmount();
    }
  }, [open, farewellId]);

  // Mock UPI Data (Ideally fetch from backend/context)
  const upiId = "ravisingh55v@ptyes";
  const upiUrl = `upi://pay?pa=${upiId}&pn=Farewell&am=${data.amount}&tn=Contribution`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiUrl
  )}`;

  function handleReset() {
    setData({ amount: "", method: "upi", transactionId: "" });
    setStep("amount");
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.transactionId) {
      toast.error("Transaction ID is required");
      return;
    }

    const formData = new FormData();
    formData.append("farewellId", farewellId);
    formData.append("amount", data.amount);
    formData.append("method", data.method);
    formData.append("transactionId", data.transactionId);

    const fileInput = (
      document.getElementById("screenshot") as HTMLInputElement
    )?.files?.[0];
    if (fileInput) {
      formData.append("screenshot", fileInput);
    }

    startTransition(async () => {
      const result = await createContributionAction(formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Contribution added successfully!");
        handleReset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setStep("amount")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contribution
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make a Contribution</DialogTitle>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <Label className="text-right flex items-center justify-between">
                <span>Contribution Amount</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Fixed
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  value={data.amount}
                  className="pl-8 text-lg font-semibold bg-muted"
                  readOnly
                  disabled={loadingAmount}
                />
                {loadingAmount && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This is the assigned contribution amount for everyone.
              </p>
            </div>
            <Button
              className="w-full"
              disabled={
                !data.amount || Number(data.amount) <= 0 || loadingAmount
              }
              onClick={() => setStep("method")}
            >
              Next: Select Method
            </Button>
          </div>
        )}

        {step === "method" && (
          <div className="space-y-3 py-2 animate-in slide-in-from-right duration-200">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Pay ₹{data.amount} via
            </div>

            <button
              onClick={() => {
                setData({ ...data, method: "upi" });
                setStep("pay");
              }}
              className="w-full p-3 bg-muted/50 hover:bg-muted border rounded-lg flex items-center gap-3 transition-all"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm">UPI / QR Code</div>
                <div className="text-xs text-muted-foreground">
                  GooglePay, PhonePe, Paytm
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setData({ ...data, method: "bank_transfer" });
                setStep("pay");
              }}
              className="w-full p-3 bg-muted/50 hover:bg-muted border rounded-lg flex items-center gap-3 transition-all"
            >
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm">Bank Transfer</div>
                <div className="text-xs text-muted-foreground">IMPS, NEFT</div>
              </div>
            </button>

            <button
              onClick={() => {
                setData({ ...data, method: "cash" });
                setStep("verify");
              }}
              className="w-full p-3 bg-muted/50 hover:bg-muted border rounded-lg flex items-center gap-3 transition-all"
            >
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm">Cash / Other</div>
                <div className="text-xs text-muted-foreground">
                  Pay to Organizer
                </div>
              </div>
            </button>

            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setStep("amount")}
            >
              Back
            </Button>
          </div>
        )}

        {step === "pay" && (
          <div className="space-y-4 py-2 animate-in slide-in-from-right duration-200">
            {data.method === "upi" ? (
              <div className="text-center">
                <div className="relative w-48 h-48 mx-auto bg-white p-2 rounded-lg border mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm font-mono bg-muted py-1 px-3 rounded inline-block mb-1">
                  {upiId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Scan with any UPI app
                </p>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm border-l-4 border-purple-500">
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Bank Name
                  </span>
                  <span className="font-medium">HDFC Bank</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Account No.
                  </span>
                  <span className="font-mono">5010023485123</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">
                    IFSC Code
                  </span>
                  <span className="font-mono">HDFC0001234</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Beneficiary
                  </span>
                  <span className="font-medium">Farewell Committee</span>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={() => setStep("verify")}>
              I Have Paid
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep("method")}
            >
              Back
            </Button>
          </div>
        )}

        {step === "verify" && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 py-2 animate-in slide-in-from-right duration-200"
          >
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-2">
              <p className="text-xs text-blue-600 flex items-center gap-2">
                Paying <strong>₹{data.amount}</strong> via{" "}
                <span className="capitalize">
                  {data.method.replace("_", " ")}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Transaction ID / Reference No.</Label>
              <Input
                name="transactionId"
                placeholder="e.g. UTR Number or Receipt No"
                value={data.transactionId}
                onChange={(e) =>
                  setData({ ...data, transactionId: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Screenshot (Optional)</Label>
              <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Input
                  id="screenshot"
                  type="file"
                  className="hidden"
                  accept="image/*"
                />
                <Label htmlFor="screenshot" className="cursor-pointer block">
                  <Upload className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    Click to upload proof
                  </span>
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Verify Payment"
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep("pay")}
            >
              Back
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
