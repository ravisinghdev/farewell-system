"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Clock,
  MoreVertical,
  Flame,
  Play,
  Pause,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

// Assuming we might not have a strict type file for TimelineBlock yet, defining interface locally or based on DB
export interface TimelineBlock {
  id: string;
  title: string;
  type: string;
  start_time_projected?: string;
  duration_seconds: number;
  color_code?: string;
  order_index: number;
  reaction_count?: number;
  has_liked?: boolean;
}

interface LiveTimelineProps {
  blocks: TimelineBlock[];
  isAdmin: boolean;
  onHype: (id: string) => void;
  onEdit?: (block: TimelineBlock) => void;
}

export function LiveTimeline({
  blocks,
  isAdmin,
  onHype,
  onEdit,
}: LiveTimelineProps) {
  // We want to calculate "current" block based on time if start_time_projected is real
  // Or just list them sequentially.

  // Sorting
  const sortedBlocks = [...blocks].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {sortedBlocks.map((block, index) => {
        // Calculate format minutes:seconds
        const mins = Math.floor(block.duration_seconds / 60);

        return (
          <div key={block.id} className="relative pl-8 md:pl-0 group">
            {/* Mobile Timeline Line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border md:hidden" />

            {/* Desktop Layout: Time on Left, Card on Right */}
            <div className="md:flex gap-6 items-start">
              <div className="hidden md:flex flex-col items-end w-24 pt-4 text-right shrink-0">
                <span className="text-sm font-bold text-muted-foreground font-mono">
                  {block.start_time_projected
                    ? format(new Date(block.start_time_projected), "h:mm a")
                    : `#${index + 1}`}
                </span>
                <span className="text-xs text-muted-foreground/50">
                  {mins}m
                </span>
              </div>

              {/* The Card */}
              <Card
                className={cn(
                  "relative flex-1 transition-all hover:bg-muted/50 border-l-4",
                  "border-l-primary" // Default color, check color_code later
                )}
                style={{ borderLeftColor: block.color_code }}
              >
                {/* Mobile Time Badge */}
                <div className="md:hidden absolute -left-10 top-4 w-6 h-6 rounded-full bg-background border-2 border-primary z-10 flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </div>

                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 uppercase tracking-wider"
                      >
                        {block.type}
                      </Badge>
                      {/* Live Indicator (mock logic for now) */}
                      {index === 0 && (
                        <Badge
                          variant="default"
                          className="bg-red-500 hover:bg-red-600 text-[10px] h-5 px-1.5 animate-pulse"
                        >
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-lg truncate">
                      {block.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={block.has_liked ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "flex flex-col h-auto py-1 px-3 gap-0",
                        block.has_liked
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "text-muted-foreground"
                      )}
                      onClick={() => onHype(block.id)}
                    >
                      <Flame
                        className={cn(
                          "w-4 h-4 mb-0.5",
                          block.has_liked && "fill-current"
                        )}
                      />
                      <span className="text-[10px] font-bold">
                        {block.reaction_count || 0}
                      </span>
                    </Button>

                    {isAdmin && onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(block)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}

      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Timeline is empty. Admin can add blocks.</p>
        </div>
      )}
    </div>
  );
}
