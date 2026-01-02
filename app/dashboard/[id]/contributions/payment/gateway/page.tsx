"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  getGatewayOrderAction,
  verifyGatewayOrderAction,
  checkGatewayOrderStatusAction,
} from "@/app/actions/gateway-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  QrCode as QrCodeIcon,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";

export default function GatewayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detect Mobile
  useEffect(() => {
    const mobileCheck = /iPhone|iPad|Pod|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  // Load Order
  useEffect(() => {
    if (!orderId) return;
    async function load() {
      const res = await getGatewayOrderAction(orderId!);
      if (res.order) {
        setOrder(res.order);

        // Use Farewell Name as PN
        const vpa = "ravisingh55v@ptyes"; // MOCK VPA
        const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(
          res.order.farewells?.name
        )}&am=${res.order.amount}&tr=${
          res.order.id
        }&tn=Farewell%20Contribution`;

        try {
          const url = await QRCode.toDataURL(upiString);
          setQrCodeUrl(url);
        } catch (e) {
          console.error(e);
        }
      } else {
        toast.error("Invalid Order Session");
      }
      setLoading(false);
    }
    load();
  }, [orderId]);

  async function handleSubmitUtr() {
    if (!utr || utr.length < 4) {
      toast.error("Please enter a valid UTR / Reference ID");
      return;
    }

    setSubmitting(true);
    // Submit UTR for verification
    const res = await verifyGatewayOrderAction(orderId!, "upi", utr);

    if (res.success) {
      toast.success("Payment Submitted for Verification!");
      router.replace(`/dashboard/${id}/contributions/payment?success=true`);
    } else {
      toast.error(res.error || "Submission Failed");
      setSubmitting(false);
    }
  }

  // UPI Deep Links
  const getUpiLink = (app: string) => {
    if (!order) return "#";
    const vpa = "ravisingh55v@ptyes";
    const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(
      order.farewells?.name
    )}&am=${order.amount}&tr=${order.id}&tn=Farewell%20Contribution`;
    return upiString;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3 h-3" /> Secure Payment Gateway
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.farewells?.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Order ID: {order.id.slice(0, 8)}
          </p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-2xl">
          <CardHeader className="bg-muted/30 pb-6 border-b">
            <div className="flex justify-between items-end">
              <div>
                <CardDescription>Total Payable</CardDescription>
                <CardTitle className="text-4xl font-bold">
                  ₹{order.amount}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* DEVICE SPECIFIC UI */}
            {isMobile ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Smartphone className="w-12 h-12 mx-auto text-primary mb-2 opacity-80" />
                  <h3 className="font-semibold text-lg">Pay via UPI App</h3>
                  <p className="text-xs text-muted-foreground">
                    Tap an app to pay, then come back to enter UTR.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a href={getUpiLink("gpay")} className="col-span-1">
                    <Button
                      variant="outline"
                      className="w-full h-14 flex flex-col gap-0.5 border-2 hover:border-blue-500 hover:bg-blue-50"
                    >
                      <span className="font-bold text-blue-600">
                        Google Pay
                      </span>
                    </Button>
                  </a>
                  <a href={getUpiLink("phonepe")} className="col-span-1">
                    <Button
                      variant="outline"
                      className="w-full h-14 flex flex-col gap-0.5 border-2 hover:border-purple-500 hover:bg-purple-50"
                    >
                      <span className="font-bold text-purple-600">PhonePe</span>
                    </Button>
                  </a>
                  <a href={getUpiLink("paytm")} className="col-span-1">
                    <Button
                      variant="outline"
                      className="w-full h-14 flex flex-col gap-0.5 border-2 hover:border-cyan-500 hover:bg-cyan-50"
                    >
                      <span className="font-bold text-cyan-600">Paytm</span>
                    </Button>
                  </a>
                  <a href={getUpiLink("all")} className="col-span-1">
                    <Button
                      variant="outline"
                      className="w-full h-14 flex flex-col gap-0.5 border-2"
                    >
                      <span className="font-bold">Other Apps</span>
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border shadow-inner">
                  {qrCodeUrl ? (
                    <Image
                      src={qrCodeUrl}
                      alt="Payment QR"
                      width={256}
                      height={256}
                      className="w-64 h-64 mix-blend-multiply"
                      unoptimized
                    />
                  ) : (
                    <div className="w-64 h-64 bg-muted flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <p className="mt-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <QrCodeIcon className="w-4 h-4" /> Scan with any UPI App
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 pt-0 bg-muted/10 border-t flex flex-col gap-4">
            <div className="w-full space-y-3 pt-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Confirm Payment
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter UPI Reference ID (UTR) / Transaction ID"
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmitUtr}
                disabled={submitting || !utr}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Verifying...
                  </>
                ) : (
                  "Submit Payment Details"
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                By clicking submit, you confirm that you have transferred the
                amount.
              </p>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <ShieldCheck className="w-3 h-3 inline mr-1" />
          Internal Payment Portal
        </p>
      </div>
    </div>
  );
}
