"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelineBlock } from "@/types/timeline";
import { format } from "date-fns";
import {
  GripVertical,
  Clock,
  Mic2,
  Coffee,
  Megaphone,
  MoreVertical,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TimelineBlockProps {
  block: TimelineBlock;
  startTime: Date;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function TimelineBlockItem({
  block,
  startTime,
  onDelete,
  onEdit,
}: TimelineBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const endTime = new Date(startTime.getTime() + block.duration_seconds * 1000);

  // One UI Colors & Icons mapping
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "performance":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/10",
          border: "border-blue-200 dark:border-blue-800",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          icon: <Mic2 className="w-5 h-5" />,
        };
      case "break":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/10",
          border: "border-amber-200 dark:border-amber-800",
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
          iconColor: "text-amber-600 dark:text-amber-400",
          icon: <Coffee className="w-5 h-5" />,
        };
      case "announcement":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/10",
          border: "border-purple-200 dark:border-purple-800",
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
          iconColor: "text-purple-600 dark:text-purple-400",
          icon: <Megaphone className="w-5 h-5" />,
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800/30",
          border: "border-gray-200 dark:border-gray-700",
          iconBg: "bg-gray-100 dark:bg-gray-800",
          iconColor: "text-gray-500",
          icon: <Clock className="w-5 h-5" />,
        };
    }
  };

  const styles = getTypeStyles(block.type);
  const isPerformance = block.type === "performance";
  const riskLevel = block.performance?.risk_level;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layoutId={block.id}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.6 : 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging
          ? "0 20px 40px -10px rgba(0,0,0,0.15)"
          : "0 2px 5px -1px rgba(0,0,0,0.05)",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className={cn(
        "relative group mb-3 rounded-2xl border overflow-hidden backdrop-blur-sm",
        styles.bg,
        styles.border,
        isDragging && "cursor-grabbing ring-2 ring-primary ring-offset-2 z-50"
      )}
    >
      <div className="flex items-stretch min-h-[5rem]">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="w-10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground/40" />
        </div>

        {/* Time Pillar */}
        <div className="flex flex-col justify-center items-end pr-4 pl-1 border-r border-black/5 dark:border-white/5 min-w-[5rem] py-3">
          <span className="text-sm font-bold font-mono tracking-tight text-foreground/80">
            {format(startTime, "HH:mm")}
          </span>
          <span className="text-xs font-mono text-muted-foreground/60">
            {format(endTime, "HH:mm")}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 pl-4 flex flex-col justify-center relative overflow-hidden">
          {/* Background Gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent dark:from-black/10 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-1.5 rounded-lg shrink-0",
                    styles.iconBg,
                    styles.iconColor
                  )}
                >
                  {styles.icon}
                </div>
                <h4 className="font-semibold text-base leading-tight line-clamp-1">
                  {block.performance ? block.performance.title : block.title}
                </h4>
                {riskLevel === "high" && (
                  <Badge
                    variant="destructive"
                    className="ml-1 text-[10px] h-5 px-1.5 rounded-full uppercase tracking-wider"
                  >
                    High Risk
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground pl-1">
                <span className="flex items-center gap-1 font-medium bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  {Math.floor(block.duration_seconds / 60)}m
                </span>

                {block.performance?.lead_coordinator && (
                  <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    {block.performance.lead_coordinator.full_name}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-xl shadow-lg border-muted"
              >
                <DropdownMenuItem
                  className="gap-2 p-2.5 cursor-pointer rounded-lg focus:bg-accent"
                  onClick={() => onEdit?.(block.id)}
                >
                  <Clock className="w-4 h-4" /> Edit Duration
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 p-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                  onClick={() => onDelete?.(block.id)}
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}




