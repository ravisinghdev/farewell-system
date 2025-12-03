"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDutiesAction } from "@/actions/duties"; // We might need a getDutyByIdAction or filter from getDuties
import { useFarewell } from "@/components/providers/farewell-provider";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseSubmissionForm } from "@/components/duties/expense-submission-form";
import { toast } from "sonner";
import {
  respondToAssignmentAction,
  completeDutyAction,
  voteOnReceiptAction,
} from "@/actions/duties";
import { format } from "date-fns";
import { useRealtimeDutyDetails } from "@/hooks/use-realtime-duty-details";
import { AdminVerificationPanel } from "@/components/duties/admin-verification-panel";
import { DutyUpdatesFeed } from "@/components/duties/duty-updates-feed";
import {
  Heart,
  Download,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ReceiptDetailsDialog } from "@/components/duties/receipt-details-dialog";

export default function DutyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, farewell } = useFarewell();
  const [duty, setDuty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const dutyId = params.dutyId as string;
  const farewellId = farewell.id;
  const isFarewellAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );

  const fetchDuty = async () => {
    try {
      // Optimization: Create getDutyByIdAction, but for now filtering from getDuties is okay if list isn't huge
      // Or better, just fetch all duties and find one.
      // Ideally we should have a specific action.
      const duties = await getDutiesAction(farewellId);
      const foundDuty = duties?.find((d: any) => d.id === dutyId);
      if (foundDuty) {
        setDuty(foundDuty);
      } else {
        toast.error("Duty not found");
        router.push(`/dashboard/${farewellId}/duties`);
      }
    } catch (error) {
      toast.error("Failed to load duty details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farewellId && dutyId) {
      fetchDuty();
    }
  }, [farewellId, dutyId]);

  // Sync selectedReceipt with latest duty data to ensure real-time updates in dialog
  useEffect(() => {
    if (selectedReceipt && duty?.duty_receipts) {
      const updatedReceipt = duty.duty_receipts.find(
        (r: any) => r.id === selectedReceipt.id
      );
      if (updatedReceipt) {
        setSelectedReceipt(updatedReceipt);
      }
    }
  }, [duty, selectedReceipt]);

  useRealtimeDutyDetails(dutyId, fetchDuty);

  const handleAccept = async () => {
    try {
      await respondToAssignmentAction(dutyId, true);
      toast.success("Duty accepted");
      fetchDuty();
    } catch (error) {
      toast.error("Failed to accept duty");
    }
  };

  const handleDecline = async () => {
    try {
      await respondToAssignmentAction(dutyId, false);
      toast.success("Duty declined");
      fetchDuty();
    } catch (error) {
      toast.error("Failed to decline duty");
    }
  };

  const handleComplete = async () => {
    try {
      await completeDutyAction(dutyId);
      toast.success("Duty marked as completed");
      fetchDuty();
    } catch (error) {
      toast.error("Failed to complete duty");
    }
  };

  const handleVote = async (receiptId: string) => {
    try {
      await voteOnReceiptAction(receiptId);
      fetchDuty();
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "receipt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!duty) return null;

  const myAssignment = duty.duty_assignments?.find(
    (da: any) => da.user_id === user.id
  );
  const isAssignee = !!myAssignment;
  const isPendingAcceptance =
    myAssignment?.status === "pending" && duty.status !== "completed";

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Duties
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{duty.title}</h1>
            <Badge
              variant={
                duty.status === "completed"
                  ? "default"
                  : duty.status === "in_progress"
                  ? "secondary"
                  : "outline"
              }
            >
              {duty.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">{duty.description}</p>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          {duty.deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due {format(new Date(duty.deadline), "PPP")}</span>
            </div>
          )}
          {duty.expense_limit > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Budget: ₹{duty.expense_limit}</span>
            </div>
          )}
          {duty.status === "expense_approved" || duty.status === "completed" ? (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <DollarSign className="h-4 w-4" />
              <span>
                Final Cost: ₹
                {duty.duty_receipts
                  ?.filter((r: any) => r.status === "approved")
                  .reduce((acc: number, r: any) => acc + r.amount, 0) || 0}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {isAssignee && isPendingAcceptance && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-yellow-500">Action Required</h3>
              <p className="text-sm text-muted-foreground">
                Please accept or decline this duty assignment.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDecline}>
              Decline
            </Button>
            <Button onClick={handleAccept}>Accept Duty</Button>
          </div>
        </div>
      )}

      <Separator />

      <Tabs defaultValue="updates" className="w-full">
        <TabsList>
          <TabsTrigger value="updates">Updates & Activity</TabsTrigger>
          <TabsTrigger value="expenses">Expenses & Receipts</TabsTrigger>
          {isFarewellAdmin && (
            <TabsTrigger value="admin">Admin Controls</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="updates" className="mt-6">
          <DutyUpdatesFeed
            duty={duty}
            isAssignee={isAssignee}
            onUpdate={fetchDuty}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Submitted Expenses</h3>
              {duty.duty_receipts?.length === 0 ? (
                <p className="text-muted-foreground">
                  No expenses submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {duty.duty_receipts.map((receipt: any) => (
                    <div
                      key={receipt.id}
                      className={`border rounded-lg p-4 ${
                        receipt.status === "approved"
                          ? "bg-green-50 border-green-200"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">₹{receipt.amount}</span>
                        <Badge
                          variant={
                            receipt.status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {receipt.status}
                        </Badge>
                      </div>
                      {receipt.items && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {receipt.items.length} items
                        </div>
                      )}

                      {receipt.evidence_files &&
                        receipt.evidence_files.length > 0 && (
                          <ReceiptCardCarousel
                            files={receipt.evidence_files}
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setDetailsOpen(true);
                            }}
                          />
                        )}

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-2">
                          {receipt.evidence_files &&
                            receipt.evidence_files.length > 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      receipt.evidence_files[0],
                                      "_blank"
                                    )
                                  }
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" /> View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDownload(
                                      receipt.evidence_files[0],
                                      `receipt-${receipt.id}`
                                    )
                                  }
                                >
                                  <Download className="h-4 w-4 mr-2" /> Download
                                </Button>
                              </>
                            )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> Details
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1 ${
                              receipt.receipt_votes?.some(
                                (v: any) => v.user_id === user.id
                              )
                                ? "text-red-500 hover:text-red-600"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => handleVote(receipt.id)}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                receipt.receipt_votes?.some(
                                  (v: any) => v.user_id === user.id
                                )
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            <span>{receipt.receipt_votes?.length || 0}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAssignee &&
              (duty.status === "in_progress" ||
                myAssignment?.status === "accepted") && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Submit New Expense
                  </h3>
                  <ExpenseSubmissionForm
                    dutyId={dutyId}
                    onSuccess={fetchDuty}
                  />
                </div>
              )}
          </div>

          <ReceiptDetailsDialog
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            receipt={selectedReceipt}
            currentUserId={user.id}
            onVote={handleVote}
          />
        </TabsContent>

        {isFarewellAdmin && (
          <TabsContent value="admin" className="mt-6">
            <AdminVerificationPanel duty={duty} onUpdate={fetchDuty} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function ReceiptCardCarousel({
  files,
  onClick,
}: {
  files: string[];
  onClick: () => void;
}) {
  const [index, setIndex] = useState(0);

  const next = (e: any) => {
    e.stopPropagation();
    if (index < files.length - 1) setIndex(index + 1);
  };

  const prev = (e: any) => {
    e.stopPropagation();
    if (index > 0) setIndex(index - 1);
  };

  return (
    <div
      className="relative mb-4 mt-2 rounded-md overflow-hidden border bg-muted/20 h-48 group cursor-pointer"
      onClick={onClick}
    >
      <img
        src={files[index]}
        alt={`Receipt ${index + 1}`}
        className="h-full w-full object-cover transition-all duration-300"
      />

      {files.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            onClick={prev}
            disabled={index === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            onClick={next}
            disabled={index === files.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {index + 1} / {files.length}
          </div>
        </>
      )}
    </div>
  );
}
