"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPaymentAction } from "@/app/actions/payout-actions";
import { toast } from "sonner";
import { Loader2, IndianRupee } from "lucide-react";

interface RequestPaymentFormProps {
  farewellId: string;
  userId: string;
  assignedAmount: number; // Balance limit
}

export function RequestPaymentForm({
  farewellId,
  userId,
  assignedAmount,
}: RequestPaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!amount) return;
    const reqAmount = parseFloat(amount);
    if (reqAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    // Optional: Check if amount > assignedAmount
    // if (reqAmount > assignedAmount) {
    //     toast.error("Amount exceeds assigned budget");
    //     return;
    // }

    setLoading(true);
    try {
      const result = await requestPaymentAction(farewellId, userId, reqAmount);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment requested successfully");
        setAmount("");
      }
    } catch (e) {
      toast.error("Failed to request payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Payment</CardTitle>
        <CardDescription>
          Withdraw from your assigned budget. Available: ₹{assignedAmount}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Amount (₹)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button
          onClick={handleRequest}
          disabled={loading || !amount}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <IndianRupee className="mr-2 h-4 w-4" />
          Request Payout
        </Button>
      </CardContent>
    </Card>
  );
}
