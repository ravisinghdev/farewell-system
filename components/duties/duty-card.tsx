"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Plus,
  Clock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { useFarewell } from "@/components/providers/farewell-provider";

interface DutyCardProps {
  duty: any;
  onUpdate: () => void;
}

export function DutyCard({ duty, onUpdate }: DutyCardProps) {
  const router = useRouter();
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;
  const currentUserId = user.id;
  const isFarewellAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );
  const [assignOpen, setAssignOpen] = useState(false);

  const myAssignment = duty.duty_assignments?.find(
    (a: any) => a.user_id === currentUserId
  );

  const isPendingAcceptance =
    myAssignment?.status === "pending" && duty.status === "awaiting_acceptance";

  const approvedReceipts =
    duty.duty_receipts?.filter((r: any) => r.status === "approved") || [];

  const totalSpent = approvedReceipts.reduce(
    (sum: number, r: any) => sum + Number(r.amount),
    0
  );
  const progress = duty.expense_limit
    ? (totalSpent / duty.expense_limit) * 100
    : 0;

  return (
    <>
      <Card
        className="flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer"
        onClick={() =>
          router.push(`/dashboard/${farewellId}/duties/${duty.id}`)
        }
      >
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
              {duty.status.replace(/_/g, " ")}
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

          {duty.expense_limit > 0 && (
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
                    className={`flex items-center gap-1 rounded-full px-2 py-1 border ${
                      assignment.status === "accepted"
                        ? "bg-secondary/50 border-transparent"
                        : assignment.status === "rejected"
                        ? "bg-destructive/10 border-destructive/20"
                        : "bg-muted border-dashed"
                    }`}
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
                    {assignment.status === "accepted" && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    {assignment.status === "rejected" && (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    {assignment.status === "pending" && (
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No one assigned
                </span>
              )}
            </div>
          </div>

          {isPendingAcceptance && (
            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-md p-2 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Action Required: Accept Duty
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 border-t flex gap-2">
          {isFarewellAdmin ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setAssignOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Assign
            </Button>
          ) : (
            <div className="flex-1"></div>
          )}
          <Button size="sm" variant="ghost" className="gap-2">
            Details <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AssignmentDialog
        dutyId={duty.id}
        farewellId={farewellId}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSuccess={onUpdate}
      />
    </>
  );
}
