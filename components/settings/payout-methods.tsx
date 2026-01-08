"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPayoutMethodsAction,
  addPayoutMethodAction,
  deletePayoutMethodAction,
} from "@/app/actions/payout-actions";
import { toast } from "sonner";
import {
  Loader2,
  Trash,
  Plus,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react";

export function PayoutMethods() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [upiId, setUpiId] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [cashInfo, setCashInfo] = useState("");

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const data = await getPayoutMethodsAction();
      setMethods(data || []);
    } catch (error) {
      toast.error("Failed to load payout methods");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (type: "upi" | "bank_transfer" | "cash") => {
    setSubmitting(true);
    try {
      let details = {};
      if (type === "upi") {
        if (!upiId) return;
        details = { upi_id: upiId };
      } else if (type === "bank_transfer") {
        if (!accountNo || !ifsc || !holderName) return;
        details = { account_no: accountNo, ifsc, holder_name: holderName };
      } else {
        details = { info: cashInfo || "Cash in hand" };
      }

      await addPayoutMethodAction(type, details);
      toast.success("Payout method added");
      setUpiId("");
      setAccountNo("");
      setIfsc("");
      setHolderName("");
      setCashInfo("");
      fetchMethods();
    } catch (error) {
      toast.error("Failed to add payout method");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayoutMethodAction(id);
      toast.success("Method deleted");
      fetchMethods();
    } catch (error) {
      toast.error("Failed to delete method");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Your Payout Methods</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to be reimbursed for expenses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => (
          <Card key={method.id} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {method.method_type === "upi" && <Wallet className="h-4 w-4" />}
                {method.method_type === "bank_transfer" && (
                  <CreditCard className="h-4 w-4" />
                )}
                {method.method_type === "cash" && (
                  <Banknote className="h-4 w-4" />
                )}
                {method.method_type === "upi"
                  ? "UPI"
                  : method.method_type === "bank_transfer"
                  ? "Bank Transfer"
                  : "Cash"}
                {method.is_primary && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded ml-auto">
                    Primary
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {method.method_type === "upi" && <p>{method.details.upi_id}</p>}
                {method.method_type === "bank_transfer" && (
                  <>
                    <p>{method.details.holder_name}</p>
                    <p>A/C: {method.details.account_no}</p>
                    <p>IFSC: {method.details.ifsc}</p>
                  </>
                )}
                {method.method_type === "cash" && <p>{method.details.info}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(method.id)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Method</CardTitle>
          <CardDescription>Add a new way to receive payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upi">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upi">UPI</TabsTrigger>
              <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
              <TabsTrigger value="cash">Cash</TabsTrigger>
            </TabsList>

            <TabsContent value="upi" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input
                  placeholder="username@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleAddMethod("upi")}
                disabled={submitting || !upiId}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                Add UPI
              </Button>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  placeholder="Name as per bank"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="Account No."
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    placeholder="IFSC"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => handleAddMethod("bank_transfer")}
                disabled={submitting || !accountNo || !ifsc || !holderName}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                Add Bank Account
              </Button>
            </TabsContent>

            <TabsContent value="cash" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Instructions (Optional)</Label>
                <Input
                  placeholder="e.g. Hand over to me in class"
                  value={cashInfo}
                  onChange={(e) => setCashInfo(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleAddMethod("cash")}
                disabled={submitting}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                Add Cash Preference
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
