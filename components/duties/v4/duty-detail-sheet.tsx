"use client";

import { useState } from "react";
import { Duty } from "@/app/actions/duty-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Circle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { AssigneeManager } from "./assignee-manager";
import { ReceiptManager } from "./receipt-manager";

interface DutyDetailSheetProps {
  duty: Duty;
  children: React.ReactNode;
  isAdmin: boolean;
  farewellId: string;
  allMembers?: { id: string; full_name: string; avatar_url: string }[];
  currentUserId: string;
}

export function DutyDetailSheet({
  duty,
  children,
  isAdmin,
  farewellId,
  allMembers = [],
  currentUserId,
}: DutyDetailSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Status Badge Logic
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            Pending
          </Badge>
        );
    }
  };

  const priorityColor =
    {
      high: "text-red-400",
      medium: "text-yellow-400",
      low: "text-blue-400",
    }[duty.priority || "medium"] || "text-gray-400";

  const isAssignee =
    duty.assignments?.some((a) => a.user_id === currentUserId) || false;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 text-white p-0 shadow-2xl shadow-black/50"
      >
        <ScrollArea className="h-full">
          {/* Hero Header with Gradient */}
          <div className="relative p-6 pb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4">
                <Badge
                  variant="outline"
                  className={`capitalize ${priorityColor} border-current bg-white/5 backdrop-blur-md px-3 py-1 text-xs tracking-wider font-medium`}
                >
                  {(duty.priority || "Medium") + " Priority"}
                </Badge>
                {getStatusBadge(duty.status)}
              </div>
              <SheetTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tight">
                {duty.title}
              </SheetTitle>
              <div className="flex items-center gap-3 text-zinc-400 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{" "}
                  {format(new Date(duty.created_at), "PPP")}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1">
                  Created by {duty.created_by ? "Admin" : "System"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Main Content */}
          <div className="p-6 space-y-8">
            {/* Description Card */}
            <div className="group space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-2">
                <FileText className="w-3 h-3" /> Overview
              </h4>
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-sm text-zinc-300 leading-relaxed group-hover:bg-white/[0.05] group-hover:border-white/10 transition-all duration-300">
                {duty.description || (
                  <span className="text-zinc-500 italic">
                    No description provided for this duty.
                  </span>
                )}
              </div>
            </div>

            {/* Assignment Section */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Team
              </h4>
              <div className="p-1 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-sm shadow-inner">
                <div className="bg-zinc-950/50 rounded-xl p-4">
                  <AssigneeManager
                    duty={duty}
                    farewellId={farewellId}
                    isAdmin={isAdmin}
                    allMembers={allMembers}
                  />
                </div>
              </div>
            </div>

            {/* Receipt Manager */}
            <div className="space-y-3">
              <ReceiptManager
                duty={duty}
                farewellId={farewellId}
                isAssignee={isAssignee}
                isAdmin={isAdmin}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 space-y-2 hover:border-blue-500/40 transition-colors">
                <div className="text-xs text-blue-300/70 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Deadline
                </div>
                <div className="text-lg font-semibold text-blue-100">
                  {duty.deadline
                    ? format(new Date(duty.deadline), "MMM d, yyyy")
                    : "None"}
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="text-xs text-emerald-300/70 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Budget
                </div>
                <div className="text-lg font-semibold text-emerald-100">
                  {formatCurrency(duty.expense_limit)}
                </div>
              </Card>
            </div>

            {/* Visual Footer decoration */}
            <div className="pt-8 flex justify-center opacity-30">
              <div className="w-16 h-1 rounded-full bg-white/20" />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
