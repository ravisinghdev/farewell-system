"use client";

import { TaskWithDetails } from "@/app/actions/task-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface TaskScheduleWidgetProps {
  tasks: TaskWithDetails[];
}

export function TaskScheduleWidget({ tasks }: TaskScheduleWidgetProps) {
  // Sort by due date, take top 4
  const scheduledTasks = tasks
    .filter((t) => t.due_at && t.status !== "done")
    .sort(
      (a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()
    )
    .slice(0, 4);

  return (
    <div className="bg-card rounded-[2rem] border shadow-sm p-6 flex flex-col text-card-foreground">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Schedule
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Strip (Mock visual) */}
      <div className="flex justify-between mb-6 px-2">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, i) => (
          <div
            key={day}
            className={`flex flex-col items-center gap-1 ${
              day === "We"
                ? "text-purple-600 font-bold"
                : "text-muted-foreground"
            }`}
          >
            <span className="text-xs">{day}</span>
            <span
              className={`text-sm ${
                day === "We"
                  ? "bg-purple-100 w-8 h-8 flex items-center justify-center rounded-full"
                  : ""
              }`}
            >
              {15 + i}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-6 relative ml-2 flex-1">
        {/* Vertical Line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-dashed border-l-2 border-slate-100 border-dotted" />

        {scheduledTasks.length > 0 ? (
          scheduledTasks.map((task, i) => (
            <div key={task.id} className="relative pl-8 group">
              {/* Dot */}
              <div
                className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 
                 ${
                   i === 0
                     ? "bg-green-500"
                     : i === 1
                     ? "bg-blue-500"
                     : i === 2
                     ? "bg-orange-500"
                     : "bg-purple-500"
                 }`}
              />

              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm line-clamp-1 text-foreground">
                    {task.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(task.due_at!), "hh:mm a")} -{" "}
                    {format(
                      new Date(new Date(task.due_at!).getTime() + 3600000),
                      "hh:mm a"
                    )}
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {task.assignees?.slice(0, 2).map((a) => (
                    <Avatar
                      key={a.user_id}
                      className="w-6 h-6 border-2 border-white"
                    >
                      <AvatarImage src={a.user.avatar_url || ""} />
                      <AvatarFallback>
                        {a.user.full_name?.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground text-sm py-8">
            No scheduled tasks
          </div>
        )}
      </div>
    </div>
  );
}
