"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, ShieldCheck } from "lucide-react";
import {
  castDutyVoteAction,
  adminApproveClaimAction,
  getVotesAction,
} from "@/app/actions/duty-claim-actions";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duty: any; // Full duty object with claims/votes ideally
  currentUserId: string;
  currentUserRole: string;
}

export function VerificationDialog({
  open,
  onOpenChange,
  duty,
  currentUserId,
  currentUserRole,
}: VerificationDialogProps) {
  const [votes, setVotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("vote");
  const [voteNote, setVoteNote] = useState("");

  // Admin Approval State
  const [approvedAmount, setApprovedAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");
  const [paymentMode, setPaymentMode] = useState<"online" | "offline">(
    "online"
  );
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = ["main_admin", "parallel_admin", "admin"].includes(
    currentUserRole
  );

  // Fetch votes and claims on open
  useEffect(() => {
    if (open) {
      getVotesAction(duty.id).then(setVotes);
    }
  }, [open, duty.id]);

  // Mock claim if not in duty object yet (assuming card passes logic)
  const activeClaim = duty.duty_claims?.[0];

  const handleVote = async (approve: boolean) => {
    try {
      await castDutyVoteAction(duty.id, approve, voteNote);
      toast.success(`Voted ${approve ? "Approve" : "Reject"}`);
      onOpenChange(false);
      // Refresh votes
      getVotesAction(duty.id).then(setVotes);
    } catch (e) {
      toast.error("Vote failed");
    }
  };

  const handleAdminApprove = async () => {
    if (!activeClaim) return;
    setIsSubmitting(true);
    try {
      await adminApproveClaimAction({
        claim_id: activeClaim.id,
        duty_id: duty.id,
        claimant_id: activeClaim.user_id,
        approved_amount: parseFloat(
          approvedAmount || activeClaim.claimed_amount.toString()
        ),
        deduction_reason: deductionReason,
        payment_mode: paymentMode,
        notes: adminNote,
      });
      toast.success("Duty Approved & Payment Recorded");
      onOpenChange(false);
    } catch (e) {
      toast.error("Approval failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeClaim) return null; // Or show loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Verification: {duty.title}
            <Badge variant="outline">{activeClaim.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Claimed ₹{activeClaim.claimed_amount.toLocaleString()} by user...
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 p-4 rounded-md space-y-2 text-sm">
          <p>
            <strong>Notes:</strong> {activeClaim.description || "No notes"}
          </p>
          {activeClaim.proof_url && (
            <p>
              <strong>Proof:</strong>{" "}
              <a
                href={activeClaim.proof_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
              >
                View Proof
              </a>
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vote">Community Voting</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin Approval</TabsTrigger>}
          </TabsList>

          <TabsContent value="vote" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Existing Votes</Label>
              <div className="flex gap-2 flex-wrap">
                {votes.map((v) => (
                  <Badge
                    key={v.id}
                    variant={v.vote ? "default" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {v.vote ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {v.voter?.full_name}
                  </Badge>
                ))}
                {votes.length === 0 && (
                  <span className="text-muted-foreground text-sm">
                    No votes yet.
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Your Vote</Label>
              <Textarea
                placeholder="Optional comment on quality..."
                value={voteNote}
                onChange={(e) => setVoteNote(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleVote(true)}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleVote(false)}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-4 pt-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-yellow-600 text-sm flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Admin Authority:</strong> Your decision is final and
                  overrides votes. This will generate a payment record.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Approved Amount (₹)</Label>
                  <Input
                    type="number"
                    defaultValue={activeClaim.claimed_amount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={paymentMode}
                    onValueChange={(v: any) => setPaymentMode(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online (UPI/Bank)</SelectItem>
                      <SelectItem value="offline">Offline (Cash)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deduction Reason (if any)</Label>
                <Input
                  placeholder="e.g. Late completion, Poor quality"
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Admin Note (Private)</Label>
                <Textarea
                  placeholder="Internal record..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleAdminApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Finalize & Approve"}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}




