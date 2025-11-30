"use client";

import { useState } from "react";
import {
  updateFarewellBudgetAction,
  assignMemberContributionAction,
  distributeBudgetEquallyAction,
} from "@/app/actions/budget-actions";
import { recordCashPaymentAction } from "@/app/actions/payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Loader2, Save, User, Users, Edit3, Banknote } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  userId: string;
  name: string;
  email: string;
  assignedAmount: number;
}

interface BudgetManagerProps {
  farewellId: string;
  initialBudget: number;
  initialMembers: Member[];
}

export function BudgetManager({
  farewellId,
  initialBudget,
  initialMembers,
}: BudgetManagerProps) {
  const [budget, setBudget] = useState(initialBudget);
  const [members, setMembers] = useState(initialMembers);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  // New state for manual payments
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ userId: "", amount: "" });

  async function handleSaveBudget() {
    setIsSavingBudget(true);
    const res = await updateFarewellBudgetAction(farewellId, budget);
    setIsSavingBudget(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Budget updated successfully");
    }
  }

  async function handleDistributeEqually() {
    setIsDistributing(true);
    const res = await distributeBudgetEquallyAction(farewellId, budget);
    setIsDistributing(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Budget distributed equally among all members");
      if (res.share) {
        setMembers((prev) =>
          prev.map((m) => ({ ...m, assignedAmount: res.share }))
        );
      }
    }
  }

  async function handleAssignAmount(userId: string, amount: number) {
    setSavingMemberId(userId);
    const res = await assignMemberContributionAction(
      farewellId,
      userId,
      amount
    );
    setSavingMemberId(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Assigned amount updated");
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, assignedAmount: amount } : m
        )
      );
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentData.userId || !paymentData.amount) {
      toast.error("Please select a user and enter amount");
      return;
    }

    setIsRecordingPayment(true);
    const res = await recordCashPaymentAction(
      farewellId,
      paymentData.userId,
      Number(paymentData.amount)
    );
    setIsRecordingPayment(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Cash payment recorded successfully");
      setPaymentDialogOpen(false);
      setPaymentData({ userId: "", amount: "" });
    }
  }

  return (
    <div className="space-y-8">
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            Farewell Budget Management
          </h3>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 text-white hover:bg-emerald-600">
                <Banknote className="w-4 h-4 mr-2" /> Record Cash Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Record Cash Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRecordPayment} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Member</Label>
                  <Select
                    value={paymentData.userId}
                    onValueChange={(val) =>
                      setPaymentData({ ...paymentData, userId: val })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-[200px]">
                      {members.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.name} ({m.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  disabled={isRecordingPayment}
                >
                  {isRecordingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="equal" className="w-full">
          {/* ... existing tabs content ... */}
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6">
            <TabsTrigger
              value="equal"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
            >
              <Users className="w-4 h-4 mr-2" /> Divide Equally
            </TabsTrigger>
            <TabsTrigger
              value="individual"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
            >
              <Edit3 className="w-4 h-4 mr-2" /> Individual Assignment
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="equal"
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-2">
                Set Total Budget
              </h4>
              <p className="text-sm text-white/60 mb-6">
                Enter the total budget goal. This amount will be divided equally
                among all {members.length} members.
              </p>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1 w-full">
                  <label className="text-sm text-white/60">
                    Total Target Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white text-lg font-bold"
                  />
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="bg-white text-black hover:bg-white/90 w-full md:w-auto"
                      disabled={isDistributing || members.length === 0}
                    >
                      {isDistributing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4 mr-2" />
                      )}
                      Distribute Equally
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        This will overwrite all existing individual assignments.
                        Each member will be assigned approximately ₹
                        {Math.ceil(budget / (members.length || 1))}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDistributeEqually}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        Confirm Distribution
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {members.length > 0 && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Each member will contribute:{" "}
                    <span className="font-bold ml-1">
                      ₹{Math.ceil(budget / members.length)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="individual"
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    Individual Assignments
                  </h4>
                  <p className="text-sm text-white/60">
                    Customize contribution amount for each member.
                  </p>
                </div>
                <Button
                  onClick={handleSaveBudget}
                  disabled={isSavingBudget}
                  variant="outline"
                  className="bg-transparent border-white/10 text-white hover:bg-white/5 w-full md:w-auto"
                >
                  {isSavingBudget ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Total Goal Only
                </Button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider border-b border-white/5 pb-2 sticky top-0 bg-[#09090b] z-10">
                  <div className="col-span-6">Member</div>
                  <div className="col-span-4">Assigned Amount (₹)</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center p-4 md:p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/5 md:border-none"
                  >
                    <div className="w-full md:col-span-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">
                          {member.name || "Unknown"}
                        </p>
                        <p className="text-white/40 text-xs truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="w-full md:col-span-4">
                      <label className="md:hidden text-xs text-white/40 mb-1 block">
                        Assigned Amount
                      </label>
                      <Input
                        type="number"
                        defaultValue={member.assignedAmount}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (val !== member.assignedAmount) {
                            handleAssignAmount(member.userId, val);
                          }
                        }}
                        className="h-8 bg-white/5 border-white/10 text-white text-sm focus:border-white/30"
                      />
                    </div>
                    <div className="w-full md:col-span-2 flex justify-end">
                      {savingMemberId === member.userId && (
                        <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </GlassCard>
    </div>
  );
}
