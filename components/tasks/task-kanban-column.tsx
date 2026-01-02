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

interface TaskKanbanColumnProps {
  id: string; // "planned" | "in_progress" | "waiting" | "completed"
  title: string;
  tasks: TaskWithDetails[];
  color?: string; // e.g. "blue", "yellow", "green"
  icon?: React.ReactNode;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (status: string) => void;
}

export function TaskKanbanColumn({
  id,
  title,
  tasks,
  color,
  icon,
  onTaskClick,
  onAddTask,
}: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const getHeaderColor = () => {
    switch (id) {
      case "todo":
        return "border-t-slate-400 bg-slate-500/5";
      case "in_progress":
        return "border-t-blue-500 bg-blue-500/5";

      case "done":
        return "border-t-green-500 bg-green-500/5";
      default:
        return "border-t-primary bg-primary/5";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full min-w-[320px] w-[320px] rounded-2xl glass-panel transition-all duration-500",
        "bg-background/20 backdrop-filter backdrop-blur-xl border border-white/10 shadow-2xl",
        isOver && "ring-2 ring-primary/50 bg-background/30 scale-[1.01]"
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "p-4 flex items-center justify-between border-b border-white/5",
          "bg-gradient-to-b from-white/5 to-transparent",
          id === "planned" && "border-t-[3px] border-t-slate-500/50",
          id === "in_progress" &&
            "border-t-[3px] border-t-blue-500 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)]",
          id === "waiting" && "border-t-[3px] border-t-orange-500/50",
          id === "completed" && "border-t-[3px] border-t-green-500/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-1.5 rounded-md bg-black/20 shadow-inner border border-white/5",
              id === "planned" && "text-slate-400",
              id === "in_progress" && "text-blue-400 animate-pulse",
              id === "waiting" && "text-orange-400",
              id === "completed" && "text-green-400"
            )}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <h3 className="font-mono text-sm tracking-widest uppercase font-bold text-foreground/80">
              {title}
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {tasks.length} UNIT{tasks.length !== 1 ? "S" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm hover:bg-white/10 hover:text-primary transition-colors"
            onClick={() => onAddTask?.(id)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm hover:bg-white/10 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 bg-transparent relative group"
      >
        {/* Grid Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <ScrollArea className="h-[calc(100vh-280px)] pr-2.5 -mr-2.5">
          <div className="space-y-4 pb-4 min-h-[150px]">
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

            {/* Empty State */}
            {tasks.length === 0 && (
              <button
                onClick={() => onAddTask?.(id)}
                className="w-full h-32 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-muted-foreground/50 gap-3 hover:bg-white/5 hover:border-primary/20 transition-all group"
              >
                <div className="p-3 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5 opacity-50 group-hover:text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">
                  Initiate Protocol
                </span>
              </button>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
