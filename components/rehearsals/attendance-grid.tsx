"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, X, Clock, User } from "lucide-react";
import { updateAttendanceAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttendanceGridProps {
  rehearsalId: string;
  farewellId: string;
  participants: any[]; // User objects
  attendance: Record<string, { status: string; timestamp: string }>;
  isAdmin: boolean;
}

export function AttendanceGrid({
  rehearsalId,
  farewellId,
  participants,
  attendance,
  isAdmin,
}: AttendanceGridProps) {
  const handleToggle = async (userId: string, currentStatus: string) => {
    if (!isAdmin) return;

    // Toggle logic: Present -> Absent -> Present
    const newStatus = currentStatus === "present" ? "absent" : "present";

    // Optimistic / Fast feedback (could be added here)
    toast.promise(
      updateAttendanceAction(rehearsalId, farewellId, userId, newStatus as any),
      {
        loading: "Updating...",
        success: `Marked as ${newStatus}`,
        error: "Failed to update",
      }
    );
  };

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground">
        <User className="w-8 h-8 mb-2 opacity-50" />
        <p>No participants assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {participants.map((user) => {
        const record = attendance[user.id] || { status: "absent" };
        const isPresent = record.status === "present";

        return (
          <Card
            key={user.id}
            onClick={() => handleToggle(user.id, record.status)}
            className={cn(
              "p-3 flex items-center gap-3 cursor-pointer transition-all border-l-4",
              isPresent
                ? "border-l-green-500 bg-green-500/10 hover:bg-green-500/20"
                : "border-l-red-500/50 hover:bg-muted/50",
              !isAdmin && "cursor-default pointer-events-none"
            )}
          >
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.full_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">
                {user.full_name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {isPresent ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 border-green-500/50 text-green-600 bg-green-500/10"
                  >
                    <Check className="w-3 h-3 mr-1" /> Present
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 text-muted-foreground"
                  >
                    Absent
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
