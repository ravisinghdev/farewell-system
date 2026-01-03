"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { format } from "date-fns";
import {
  Clock,
  Music,
  Heart,
  Calendar,
  MoreHorizontal,
  Play,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineBlockDialog } from "./timeline-block-dialog";
import {
  deleteTimelineBlockAction,
  toggleTimelineBlockHypeAction,
} from "@/app/actions/event-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimelineBlock } from "@/types/timeline";

interface FreshTimelineViewProps {
  blocks: TimelineBlock[];
  eventDetails?: any;
}

export function FreshTimelineView({
  blocks,
  eventDetails,
}: FreshTimelineViewProps) {
  const router = useRouter();
  const [editingBlock, setEditingBlock] = useState<TimelineBlock | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Realtime subscription for hype updates
  useRealtimeSubscription({
    table: "timeline_reactions",
    event: "*",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Calculate start times (simulation)
  const baseTime = eventDetails?.event_date
    ? new Date(
        `${eventDetails.event_date}T${eventDetails.event_time || "17:00:00"}`
      )
    : new Date();
  baseTime.setHours(17, 0, 0, 0); // Default 5 PM

  let currentTime = new Date(baseTime);

  const timelineItems = blocks.map((block) => {
    // Override current time if manual start is set
    if (block.manual_start_time) {
      currentTime = new Date(block.manual_start_time);
    }
    const start = new Date(currentTime);
    currentTime = new Date(
      currentTime.getTime() + block.duration_seconds * 1000
    );
    return {
      ...block,
      // reactions is an array from the join, but we want a number
      reaction_count: (block as any).reactions?.[0]?.count || 0,
      startTime: start,
      endTime: currentTime,
      status:
        new Date() >= start && new Date() < currentTime
          ? "live"
          : new Date() > currentTime
          ? "past"
          : "upcoming",
    };
  });

  return (
    <div
      className="relative min-h-screen py-10 md:py-20 overflow-hidden"
      ref={containerRef}
    >
      {/* Header */}
      <div className="relative z-10 text-center mb-16 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/50 text-foreground"
          >
            <Calendar className="w-3 h-3 mr-2" />
            {eventDetails?.event_date
              ? format(new Date(eventDetails.event_date), "MMMM do, yyyy")
              : "The Big Night"}
          </Badge>
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50">
          The Journey
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Every moment counts. Follow the night as it unfolds.
        </p>
      </div>

      {/* Timeline Container */}
      <div className="relative max-w-5xl mx-auto px-4">
        {/* Vertical Progress Line */}
        <motion.div
          className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-purple-500 to-blue-500 origin-top rounded-full"
          style={{ scaleY }}
        />
        <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-1 bg-border/30 -z-10 rounded-full" />

        <div className="space-y-12 md:space-y-24">
          {timelineItems.map((item, index) => (
            <TimelineNode
              key={item.id}
              item={item}
              index={index}
              isEven={index % 2 === 0}
              onEdit={(block) => {
                setEditingBlock(block);
                setIsDialogOpen(true);
              }}
              onDelete={async (id) => {
                const res = await deleteTimelineBlockAction(
                  id,
                  blocks[0]?.farewell_id
                );
                if (res.error) toast.error("Failed to delete");
                else toast.success("Deleted block");
              }}
            />
          ))}
        </div>
      </div>

      <TimelineBlockDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingBlock(null);
        }}
        farewellId={blocks[0]?.farewell_id || ""}
        blockToEdit={editingBlock}
      />
    </div>
  );
}

function TimelineNode({
  item,
  index,
  isEven,
  onEdit,
  onDelete,
}: {
  item: any;
  index: number;
  isEven: boolean;
  onEdit: (block: any) => void;
  onDelete: (id: string) => void;
}) {
  const [hyped, setHyped] = useState(false);
  const [hypeCount, setHypeCount] = useState(item.reaction_count || 0);

  const isLive = item.status === "live";

  // Temporary local toggle (optimistic)
  const handleHype = async () => {
    // Optimistic update
    const newStatus = !hyped;
    setHyped(newStatus);
    setHypeCount((prev: number) =>
      newStatus ? prev + 1 : Math.max(0, prev - 1)
    );

    const res = await toggleTimelineBlockHypeAction(item.id);
    if (!res.success) {
      // Revert if failed
      setHyped(!newStatus);
      setHypeCount((prev: number) => (newStatus ? prev - 1 : prev + 1));
      toast.error("Failed to hype");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative flex flex-col md:flex-row gap-8 md:gap-0",
        isEven ? "md:flex-row-reverse" : ""
      )}
    >
      {/* Spacer/Empty Side */}
      <div className="hidden md:block flex-1" />

      {/* Central Node */}
      <div className="absolute left-[20px] md:left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-10">
        <div
          className={cn(
            "w-4 h-4 rounded-full border-4 border-background transition-all duration-500",
            isLive
              ? "bg-primary scale-150 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
              : "bg-muted-foreground/30"
          )}
        />
        {isLive && (
          <div className="absolute w-8 h-8 rounded-full border border-primary/50 animate-ping opacity-75" />
        )}
      </div>

      {/* Content Card */}
      <div
        className={cn("flex-1 pl-12 md:pl-0", isEven ? "md:pr-12" : "md:pl-12")}
      >
        <div
          className={cn(
            "group relative overflow-hidden rounded-2xl border bg-background/40 backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-primary/20",
            isLive
              ? "border-primary/50 shadow-lg ring-1 ring-primary/20"
              : "border-white/10"
          )}
        >
          {/* Live Badge */}
          {isLive && (
            <div className="absolute top-4 right-4 animate-pulse">
              <Badge className="bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">
                LIVE NOW
              </Badge>
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight font-mono text-primary/80">
                {format(item.startTime, "HH:mm")}
              </span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Until {format(item.endTime, "HH:mm")}
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
            {item.performance?.title || item.title}
          </h3>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary" className="bg-secondary/50">
              <Clock className="w-3 h-3 mr-1" />
              {Math.floor(item.duration_seconds / 60)}m
            </Badge>
            {item.performance && (
              <Badge variant="secondary" className="bg-secondary/50">
                <Music className="w-3 h-3 mr-1" />
                Performance
              </Badge>
            )}
            {item.type === "break" && <Badge variant="outline">Break</Badge>}
          </div>

          {/* Artists / Performers */}
          {item.performance && (
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {item.performance.lead_coordinator?.full_name?.substring(
                  0,
                  2
                ) || "AR"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {item.performance.lead_coordinator?.full_name ||
                    "Unknown Artist"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Lead Performer
                </span>
              </div>
            </div>
          )}

          {/* Interactions */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHype}
              className={cn(
                "rounded-full transition-all duration-300 gap-1",
                hyped
                  ? "bg-pink-500/20 text-pink-500"
                  : "hover:bg-pink-500/10 hover:text-pink-400"
              )}
            >
              <Heart className={cn("w-4 h-4 mr-1", hyped && "fill-current")} />
              {hypeCount > 0 ? hypeCount : "Hype"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:bg-white/5"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isLive && (
              <Button
                size="sm"
                className="ml-auto rounded-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
              >
                <Play className="w-3 h-3 mr-2 fill-current" /> Watch
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
