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
  onUpdate?: () => void;
  currentUserId?: string;
  currentUserRole?: string;
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
        className="
          group relative flex flex-col h-full 
          rounded-2xl border border-border/50 
          bg-gradient-to-br from-card/80 to-card/40 
          backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-border
          transition-all duration-300 cursor-pointer overflow-hidden
        "
        onClick={() =>
          router.push(`/dashboard/${farewellId}/duties/${duty.id}`)
        }
      >
        {/* Status Stripe */}
        <div
          className={`absolute top-0 left-0 w-1 h-full transition-colors ${
            duty.status === "completed"
              ? "bg-emerald-500"
              : duty.status === "in_progress"
              ? "bg-blue-500"
              : "bg-amber-500"
          }`}
        />

        <div className="flex flex-col h-full pl-5">
          {" "}
          {/* Offset for stripe */}
          <CardHeader className="pb-2 pt-5 pr-5">
            <div className="flex justify-between items-start gap-4">
              <CardTitle className="font-semibold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                {duty.title}
              </CardTitle>
              <Badge
                variant="secondary"
                className={`
                    shrink-0 capitalize px-2 py-0.5 text-xs font-medium border
                    ${
                      duty.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : duty.status === "in_progress"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }
                  `}
              >
                {duty.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 pr-5 pb-4">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {duty.description || "No description provided."}
            </p>

            {/* Budget Progress */}
            {duty.expense_limit > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Budget Used</span>
                  <span>
                    {Math.round(progress)}% (₹{totalSpent} / ₹
                    {duty.expense_limit})
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress > 100
                        ? "bg-destructive"
                        : progress > 90
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-4 pb-5 pr-5 border-t border-border/40 flex items-center justify-between">
            {/* Assignees Avatars */}
            <div className="flex -space-x-2 overflow-hidden">
              {duty.duty_assignments?.length > 0 ? (
                duty.duty_assignments.map((assignment: any, i: number) => (
                  <Avatar
                    key={i}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
                  >
                    <AvatarImage src={assignment.users?.avatar_url} />
                    <AvatarFallback className="bg-muted text-[10px]">
                      {assignment.users?.full_name
                        ?.substring(0, 2)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic pl-1">
                  Unassigned
                </span>
              )}
            </div>

            {duty.deadline && (
              <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                <Clock className="mr-1 h-3 w-3" />
                {format(new Date(duty.deadline), "MMM d")}
              </div>
            )}
          </CardFooter>
        </div>

        {/* Action Overlay for Admin (optional hover effect) */}
        {isFarewellAdmin && !duty.duty_assignments?.length && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setAssignOpen(true);
              }}
              className="shadow-lg"
            >
              Assign Duty
            </Button>
          </div>
        )}
      </Card>

      <AssignmentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        dutyId={duty.id}
        farewellId={farewellId}
        currentAssignees={
          duty.duty_assignments?.map((a: any) => a.user_id) || []
        }
        onSuccess={onUpdate || (() => {})}
      />
    </>
  );
}
