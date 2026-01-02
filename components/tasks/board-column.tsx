"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { TaskWithDetails } from "@/app/actions/task-actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BoardColumnProps {
  id: string; // "planned" | "in_progress" | "waiting" | "completed"
  title: string;
  tasks: TaskWithDetails[];
  color?: string; // e.g. "blue", "yellow", "green"
  icon?: React.ReactNode;
  onTaskClick?: (taskId: string) => void;
}

export function BoardColumn({
  id,
  title,
  tasks,
  color,
  icon,
  onTaskClick,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const getHeaderColor = () => {
    switch (id) {
      case "todo":
        return "border-t-slate-400";
      case "in_progress":
        return "border-t-blue-500";

      case "done":
        return "border-t-green-500";
      default:
        return "border-t-primary";
    }
  };

  return (
    <div className="flex flex-col h-full min-w-[300px] w-[300px] rounded-xl bg-muted/30 border shadow-sm">
      {/* Column Header */}
      <div
        className={cn(
          "p-3 flex items-center justify-between border-b bg-background/50 backdrop-blur-sm rounded-t-xl border-t-4",
          getHeaderColor()
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
          <Badge
            variant="secondary"
            className="text-[10px] h-5 min-w-5 flex justify-center px-1"
          >
            {tasks.length}
          </Badge>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 bg-gradient-to-b from-transparent to-muted/10"
      >
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3 px-1 pb-4 min-h-[100px]">
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task.id)}
                />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs bg-muted/20">
                Drop items here
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
