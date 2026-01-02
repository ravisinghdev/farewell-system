"use client";

import { TaskWithDetails } from "@/app/actions/task-actions";
import { CheckCircle2, Clock, Hourglass } from "lucide-react";

interface TaskStatsBarProps {
  tasks: TaskWithDetails[];
}

export function TaskStatsBar({ tasks }: TaskStatsBarProps) {
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  // Mock "Time Saved" or calculate based on something if available, else static for visual match
  // Let's use "Pending" count as a proxy for the 3rd stat if we want dynamic data,
  // or just hardcode "12hrs Time Saved" to match the specific "Mondays" aesthetic request if it's purely visual.
  // The user asked for "exactly the same ui", so I'll try to match the *types* of stats but use real data where possible.

  // Actually, let's use "Waiting" for the 3rd or just total tasks.
  // Waiting status removed as it doesn't exist in schema

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-full border shadow-sm text-sm font-medium hover:shadow-md transition-shadow text-card-foreground">
        <div className="p-1.5 bg-foreground rounded-full text-background">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex gap-1">
          <span className="font-bold">12hrs</span>
          <span className="text-muted-foreground">Time Saved</span>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-full border shadow-sm text-sm font-medium hover:shadow-md transition-shadow text-card-foreground">
        <div className="p-1.5 bg-foreground rounded-full text-background">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex gap-1">
          <span className="font-bold">{completedCount}</span>
          <span className="text-muted-foreground">Tasks Completed</span>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-full border shadow-sm text-sm font-medium hover:shadow-md transition-shadow text-card-foreground">
        <div className="p-1.5 bg-foreground rounded-full text-background">
          <Hourglass className="w-4 h-4" />
        </div>
        <div className="flex gap-1">
          <span className="font-bold">{inProgressCount}</span>
          <span className="text-muted-foreground">Tasks In-progress</span>
        </div>
      </div>
    </div>
  );
}
