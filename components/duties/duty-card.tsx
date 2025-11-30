"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { AssignmentDialog } from "./assignment-dialog";
import { ReceiptUploadDialog } from "./receipt-upload-dialog";
import { ReceiptApprovalDialog } from "./receipt-approval-dialog";
import {
  Plus,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

import { useFarewell } from "@/components/providers/farewell-provider";

interface DutyCardProps {
  duty: any;
  onUpdate: () => void;
  // Props are now optional/unused as we use context
  currentUserId?: string;
  isFarewellAdmin?: boolean;
  farewellId?: string;
}

export function DutyCard({ duty, onUpdate }: DutyCardProps) {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;
  const currentUserId = user.id;
  const isFarewellAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );
  const [assignOpen, setAssignOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const myAssignment = duty.duty_assignments?.find(
    (a: any) => a.user_id === currentUserId
  );
  const pendingReceipts =
    duty.duty_receipts?.filter((r: any) => r.status === "pending") || [];
  const approvedReceipts =
    duty.duty_receipts?.filter((r: any) => r.status === "verified") || [];

  const totalSpent = approvedReceipts.reduce(
    (sum: number, r: any) => sum + Number(r.amount),
    0
  );
  const progress = duty.expense_limit
    ? (totalSpent / duty.expense_limit) * 100
    : 0;

  const handleReviewReceipt = (receipt: any) => {
    setSelectedReceipt(receipt);
    setApprovalOpen(true);
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {duty.title}
            </CardTitle>
            <Badge
              variant={
                duty.status === "completed"
                  ? "default"
                  : duty.status === "in_progress"
                  ? "secondary"
                  : "outline"
              }
            >
              {duty.status.replace("_", " ")}
            </Badge>
          </div>
          {duty.deadline && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due {format(new Date(duty.deadline), "MMM d, yyyy")}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {duty.description}
          </p>

          {duty.expense_limit && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Spent: ₹{totalSpent}</span>
                <span className="text-muted-foreground">
                  Limit: ₹{duty.expense_limit}
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    progress > 100 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Assigned to
            </div>
            <div className="flex flex-wrap gap-1">
              {duty.duty_assignments?.length > 0 ? (
                duty.duty_assignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-1 bg-secondary/50 rounded-full px-2 py-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={assignment.users?.avatar_url} />
                      <AvatarFallback className="text-[10px]">
                        {assignment.users?.full_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs max-w-[80px] truncate">
                      {assignment.users?.full_name}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No one assigned
                </span>
              )}
            </div>
          </div>

          {isFarewellAdmin && pendingReceipts.length > 0 && (
            <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md p-2 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {pendingReceipts.length} receipt
              {pendingReceipts.length !== 1 ? "s" : ""} pending review
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 border-t flex gap-2">
          {isFarewellAdmin ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setAssignOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign
              </Button>
              {pendingReceipts.length > 0 && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleReviewReceipt(pendingReceipts[0])}
                >
                  Review
                </Button>
              )}
            </>
          ) : myAssignment ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Receipt
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground w-full text-center py-2">
              Not assigned to you
            </div>
          )}
        </CardFooter>
      </Card>

      <AssignmentDialog
        dutyId={duty.id}
        farewellId={farewellId}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSuccess={onUpdate}
      />

      {myAssignment && (
        <ReceiptUploadDialog
          assignmentId={myAssignment.id}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSuccess={onUpdate}
        />
      )}

      {selectedReceipt && (
        <ReceiptApprovalDialog
          receipt={selectedReceipt}
          open={approvalOpen}
          onOpenChange={setApprovalOpen}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
