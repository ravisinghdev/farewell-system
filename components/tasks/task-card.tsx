"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TaskWithDetails } from "@/app/actions/task-actions";
import {
  Calendar,
  Paperclip,
  MessageSquare,
  AlertCircle,
  Hash,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TaskCardProps {
  task: TaskWithDetails;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.due_at && new Date(task.due_at) < new Date() && task.status !== "done";

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 h-[140px] bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg skew-x-[-5deg]"
      />
    );
  }

  const priorityColor =
    (task.priority as string) === "critical"
      ? "text-red-500 border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]"
      : task.priority === "high"
      ? "text-orange-500 border-orange-500/50 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]"
      : task.priority === "medium"
      ? "text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]"
      : "text-cyan-500 border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]";

  const priorityBg =
    (task.priority as string) === "critical"
      ? "bg-red-950/30"
      : task.priority === "high"
      ? "bg-orange-950/30"
      : task.priority === "medium"
      ? "bg-yellow-950/30"
      : "bg-cyan-950/30";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative mb-3"
      onClick={onClick}
    >
      {/* Holographic Container */}
      <div
        className={cn(
          "relative overflow-hidden backdrop-blur-md border rounded-lg transition-all duration-300",
          "bg-background/40 hover:bg-background/60",
          priorityColor,
          "border-l-[6px]" // Thick priority indicator
        )}
      >
        {/* Scanline Effect */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 animate-scanline pointer-events-none opacity-0 group-hover:opacity-100" />

        {/* Tech Decor - Corner */}
        <div className="absolute top-0 right-0 p-1">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              (task.priority as string) === "critical"
                ? "animate-pulse bg-red-500"
                : "bg-slate-700"
            )}
          />
        </div>

        <CardContent className="p-3 space-y-3 relative z-10">
          {/* Header ID & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 opacity-60">
              <Hash className="w-3 h-3" />
              <span className="text-[10px] font-mono tracking-widest uppercase">
                ID-{task.id.slice(0, 4)}
              </span>
            </div>
            <h4 className="font-bold text-sm leading-tight text-foreground/90 line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
              {task.title}
            </h4>
          </div>

          {/* Data Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            {task.due_at && (
              <div
                className={cn(
                  "flex items-center text-[10px] px-2 py-0.5 rounded-sm border font-mono tracking-tighter",
                  isOverdue
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}
              >
                <Calendar className="w-3 h-3 mr-1.5" />
                {format(new Date(task.due_at), "MM.dd")}
              </div>
            )}
            <div
              className={cn(
                "text-[9px] px-1.5 py-0.5 uppercase tracking-widest font-bold border rounded-sm",
                priorityBg,
                priorityColor.split(" ")[0],
                priorityColor.split(" ")[1]
              )}
            >
              {task.priority}
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          {/* Footer Metadata */}
          <div className="flex justify-between items-center">
            {/* Assignees - Overlapping circles */}
            <div className="flex -space-x-2 pl-1">
              {task.assignees?.map((assignee) => (
                <Avatar
                  key={assignee.user_id}
                  className="w-6 h-6 border-[1.5px] border-background ring-1 ring-white/10"
                >
                  <AvatarImage src={assignee.user.avatar_url || ""} />
                  <AvatarFallback className="text-[8px] bg-slate-800 text-slate-400">
                    {assignee.user.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {(!task.assignees || task.assignees.length === 0) && (
                <span className="text-[10px] text-muted-foreground font-mono opacity-50">
                  UNASSIGNED
                </span>
              )}
            </div>

            {/* Counts */}
            <div className="flex items-center gap-3 text-muted-foreground/60">
              {(task._count?.comments || 0) > 0 && (
                <div className="flex items-center text-[10px] gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span className="font-mono">{task._count?.comments}</span>
                </div>
              )}
              {(task._count?.attachments || 0) > 0 && (
                <div className="flex items-center text-[10px] gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span className="font-mono">{task._count?.attachments}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </motion.div>
  );
}
