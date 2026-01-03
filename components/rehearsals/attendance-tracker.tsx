"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  X,
  Clock,
  User,
  UserCheck,
  Calendar as CalendarIcon,
} from "lucide-react";
import { updateAttendanceAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface Participant {
  user_id: string;
  name: string;
  role: string;
  avatar_url?: string;
}

interface AttendanceRecord {
  // New Structure: { "YYYY-MM-DD": { userId: { status: ... } } }
  // Legacy: { userId: { status: ... } }
  [key: string]: any;
}

interface AttendanceTrackerProps {
  rehearsalId: string;
  farewellId: string;
  participants: Participant[];
  initialAttendance: AttendanceRecord;
  isAdmin: boolean;
}

export function AttendanceTracker({
  rehearsalId,
  farewellId,
  participants,
  initialAttendance,
  isAdmin,
}: AttendanceTrackerProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord>(
    initialAttendance || {}
  );

  // Use Date object for Calendar, string YYYY-MM-DD for logic
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  // Derive daily records safely
  const dailyRecords = attendance[selectedDateStr] || {};

  // Stats
  const presentCount = Object.values(dailyRecords).filter(
    (r: any) => r.status === "present" || r.status === "late"
  ).length;
  const totalCount = participants.length;
  const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  async function updateStatus(
    userId: string,
    status: "present" | "absent" | "late"
  ) {
    // 1. Optimistic Update
    const currentDay = attendance[selectedDateStr] || {};
    const updatedDay = {
      ...currentDay,
      [userId]: {
        status,
        timestamp: new Date().toISOString(),
      },
    };
    const newFullRecord = {
      ...attendance,
      [selectedDateStr]: updatedDay,
    };

    setAttendance(newFullRecord);

    // 2. Server Action
    const result = await updateAttendanceAction(
      rehearsalId,
      farewellId,
      userId,
      status,
      selectedDateStr
    );

    if (result.error) {
      toast.error(`Failed to save attendance: ${result.error}`);
      console.error("Attendance update error:", result.error);
      // could revert here if necessary
    }
  }

  return (
    <div className="space-y-8">
      {/* Date Selector & Stats */}
      <div className="bg-transparent border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                <UserCheck className="w-5 h-5 text-primary" />
                Attendance
              </h3>
              <div className="text-muted-foreground text-sm">
                {presentCount} of {totalCount} here
              </div>
            </div>
            <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Progress value={percentage} className="h-2" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {participants.map((person) => {
          const record = dailyRecords[person.user_id];
          const status = record?.status;

          return (
            <div
              key={person.user_id}
              className="flex items-center justify-between p-3 rounded-lg border bg-transparent hover:bg-transparent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={person.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {(person.name || "?").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{person.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {person.role}
                  </p>
                </div>
              </div>

              {isAdmin ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={status === "present" ? "default" : "outline"}
                    className={cn(
                      "h-8 px-2",
                      status === "present" && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => updateStatus(person.user_id, "present")}
                    title="Present"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "late" ? "default" : "outline"}
                    className={cn(
                      "h-8 px-2",
                      status === "late" && "bg-amber-500 hover:bg-amber-600"
                    )}
                    onClick={() => updateStatus(person.user_id, "late")}
                    title="Late"
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "absent" ? "default" : "outline"}
                    className={cn(
                      "h-8 px-2",
                      status === "absent" &&
                        "bg-destructive hover:bg-destructive/90"
                    )}
                    onClick={() => updateStatus(person.user_id, "absent")}
                    title="Absent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="px-3 py-1 bg-muted rounded text-sm font-medium capitalize">
                  {status || "Pending"}
                </div>
              )}
            </div>
          );
        })}

        {participants.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No participants in list. Add them in the Cast tab.
          </div>
        )}
      </div>
    </div>
  );
}
