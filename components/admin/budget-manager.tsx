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
      <GlassCard className="relative p-6 border border-border/50 rounded-3xl shadow-xl overflow-hidden group bg-card/50 backdrop-blur-2xl">
        {/* Subtle top light streak */}
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-32 opacity-20 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-3xl group-hover:opacity-40 transition-opacity duration-1000" />

        {/* Background Grain */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />

        {/* Header Row */}
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500/80 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase">
                Budget Console
              </p>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Farewell Budget
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Define goals, distribute shares, and track contributions with
              precision.
            </p>
          </div>

          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group relative overflow-hidden inline-flex items-center justify-center rounded-full border border-emerald-500/30 px-6 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-100/50 dark:bg-emerald-950/20 hover:bg-emerald-200/50 dark:hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all duration-300">
                <span className="relative z-10 flex items-center gap-2">
                  <Banknote className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Record Payment
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border border-border bg-popover backdrop-blur-2xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] text-foreground p-0 overflow-hidden gap-0 rounded-2xl ring-1 ring-border/5">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-500" /> Record
                  Payment
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRecordPayment} className="space-y-6 pt-2">
                <div className="px-6 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">
                      Select Member
                    </Label>
                    <Select
                      value={paymentData.userId}
                      onValueChange={(val) =>
                        setPaymentData({ ...paymentData, userId: val })
                      }
                    >
                      <SelectTrigger className="border border-input bg-secondary/50 rounded-xl text-sm h-11 backdrop-blur-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-secondary">
                        <SelectValue placeholder="Choose member..." />
                      </SelectTrigger>
                      <SelectContent className="border border-border bg-popover backdrop-blur-2xl max-h-[220px] rounded-xl shadow-2xl">
                        {members.map((m) => (
                          <SelectItem
                            key={m.userId}
                            value={m.userId}
                            className="focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-100 cursor-pointer"
                          >
                            {m.name}{" "}
                            <span className="text-muted-foreground text-xs ml-1">
                              ({m.email})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">
                      Amount (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-serif italic text-lg">
                        ₹
                      </span>
                      <Input
                        type="number"
                        value={paymentData.amount}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="h-11 pl-10 border border-input bg-secondary/50 rounded-xl text-base font-medium backdrop-blur-xl focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-secondary placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-secondary/20 border-t border-border/50">
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-bold bg-foreground text-background hover:bg-emerald-50 hover:text-emerald-950 transition-all shadow-xl shadow-black/5 dark:shadow-white/5 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
                    disabled={isRecordingPayment}
                  >
                    {isRecordingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Confirm Payment"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="relative mt-8">
          <Tabs defaultValue="equal" className="w-full">
            <TabsList className="bg-secondary/50 border border-border/50 p-1 rounded-full text-xs font-medium backdrop-blur-xl inline-flex w-auto mb-6">
              <TabsTrigger
                value="equal"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground transition-all flex items-center justify-center gap-2 px-6 py-2"
              >
                <Users className="w-3.5 h-3.5" />
                Divide Equally
              </TabsTrigger>
              <TabsTrigger
                value="individual"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground transition-all flex items-center justify-center gap-2 px-6 py-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Individual Assignment
              </TabsTrigger>
            </TabsList>

            {/* Equal Distribution */}
            <TabsContent
              value="equal"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500"
            >
              <div className="relative rounded-3xl border border-border/50 bg-card/20 p-8 overflow-hidden">
                {/* subtle diagonal sheen */}
                <div className="pointer-events-none absolute -inset-y-20 inset-x-20 opacity-20 bg-gradient-to-br from-background/10 via-transparent to-transparent group-hover:opacity-40 transition-opacity duration-700" />

                <div className="relative space-y-6">
                  <div className="space-y-2 max-w-2xl">
                    <h4 className="text-xl font-semibold text-foreground">
                      Set Total Budget
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Define the overall target amount. This value will be
                      distributed equally across{" "}
                      <span className="font-semibold text-foreground border-b border-border pb-0.5">
                        {members.length || 0} members
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="space-y-2.5 flex-1 w-full relative">
                      <label className="text-[10px] uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60 font-bold ml-1">
                        Total Target Amount (₹)
                      </label>
                      <div className="relative group/input">
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover/input:opacity-100 transition-opacity" />
                        <Input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(Number(e.target.value))}
                          className="h-14 border border-input bg-secondary/30 rounded-2xl text-2xl font-bold tracking-tight backdrop-blur-xl px-4 focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/30 font-mono"
                        />
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full md:w-auto inline-flex items-center justify-center rounded-2xl bg-foreground text-background font-bold text-sm px-8 h-14 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_25px_rgba(0,0,0,0.1)] hover:shadow-[0_0_35px_rgba(16,185,129,0.2)] hover:-translate-y-0.5"
                          disabled={isDistributing || members.length === 0}
                        >
                          {isDistributing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Users className="w-5 h-5 mr-3" />
                          )}
                          Distribute Equally
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md border border-border bg-popover backdrop-blur-2xl shadow-2xl text-foreground rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">
                            Confirm equal distribution?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-base text-muted-foreground">
                            This will overwrite all existing individual
                            assignments. Each member will be assigned
                            approximately{" "}
                            <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md">
                              ₹{Math.ceil(budget / (members.length || 1))}
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 mt-4">
                          <AlertDialogCancel className="rounded-xl border border-input bg-transparent text-foreground text-sm px-5 h-10 hover:bg-secondary hover:text-foreground mt-0">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDistributeEqually}
                            className="rounded-xl bg-foreground text-background text-sm font-bold px-6 h-10 hover:bg-foreground/90"
                          >
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {members.length > 0 && (
                    <div className="relative mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4 flex items-center justify-between group/info hover:bg-emerald-500/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 group-hover/info:border-emerald-500/40 transition-colors">
                          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600/60 dark:text-emerald-300/60 uppercase tracking-wider font-semibold mb-0.5">
                            Per Person Share
                          </p>
                          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-100">
                            ₹{Math.ceil(budget / members.length)}
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-xs text-emerald-600/40 dark:text-emerald-400/40 text-right">
                        Does not include
                        <br />
                        offline payments
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Individual Assignment */}
            <TabsContent
              value="individual"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500"
            >
              <div className="relative rounded-3xl border border-border/50 bg-card/20 p-1 overflow-hidden">
                {/* header sheen */}
                <div className="pointer-events-none absolute inset-x-6 -top-8 h-24 bg-gradient-to-b from-background/5 to-transparent opacity-60" />

                <div className="p-6 pb-2 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-foreground">
                      Individual Assignments
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Fine-tune individual shares.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveBudget}
                    disabled={isSavingBudget}
                    variant="outline"
                    className="w-full md:w-auto inline-flex items-center justify-center rounded-xl border border-border/50 bg-secondary/50 text-foreground text-xs font-semibold px-4 h-9 hover:bg-secondary hover:border-border transition-all"
                  >
                    {isSavingBudget ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-2" />
                    )}
                    Update Total Only
                  </Button>
                </div>

                {/* Members table */}
                <div className="relative">
                  {/* Header row (desktop) */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] border-b border-border/10">
                    <div className="col-span-6">Member</div>
                    <div className="col-span-4">Assigned Amount</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto px-2 pb-2 pt-2 custom-scrollbar space-y-1">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center px-4 py-3 rounded-xl hover:bg-secondary/30 border border-transparent hover:border-border/10 transition-all group/row"
                      >
                        {/* Member info */}
                        <div className="w-full md:col-span-6 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-transparent border border-border/10 flex items-center justify-center shrink-0 group-hover/row:scale-110 transition-transform">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover/row:text-primary transition-colors">
                              {member.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {/* Amount input */}
                        <div className="w-full md:col-span-4">
                          <label className="md:hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block font-bold">
                            Assigned Share
                          </label>
                          <div className="relative group/input">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs">
                              ₹
                            </span>
                            <Input
                              type="number"
                              defaultValue={member.assignedAmount}
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (val !== member.assignedAmount) {
                                  handleAssignAmount(member.userId, val);
                                }
                              }}
                              className="h-9 pl-7 border border-input bg-secondary/30 rounded-lg text-sm font-medium backdrop-blur-xl focus:bg-secondary/60 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Status / Loader */}
                        <div className="w-full md:col-span-2 flex justify-end min-h-[20px]">
                          {savingMemberId === member.userId ? (
                            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Saving
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover/row:opacity-100 transition-opacity text-[10px] text-muted-foreground font-medium px-2 py-1">
                              Edited
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {members.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Users className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-sm max-w-[200px]">
                        No members found. Add participants to configure
                        contributions.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </GlassCard>
    </div>
  );
}
