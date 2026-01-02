"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Play,
  Clock,
  Trash,
  CheckCircle2,
  GripVertical,
  SkipForward,
  Pause,
  MoreVertical,
} from "lucide-react";
import { updateRehearsalMetadataAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { addMinutes, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Segment {
  id: string;
  title: string;
  duration: number; // minutes
  notes: string;
  status: "pending" | "live" | "done";
}

interface RunOfShowExtendedProps {
  rehearsalId: string;
  farewellId: string;
  segments: Segment[]; // From metadata.segments
  rehearsalStartTime: string;
  metadata: any;
  isAdmin: boolean;
}

export function RunOfShowExtended({
  rehearsalId,
  farewellId,
  segments: initialSegments,
  rehearsalStartTime,
  metadata,
  isAdmin,
}: RunOfShowExtendedProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments || []);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("5");

  // Calculated Timings
  const timeline = useMemo(() => {
    let currentTime = new Date(rehearsalStartTime);
    return segments.map((segment) => {
      const start = new Date(currentTime);
      const end = addMinutes(start, segment.duration);
      currentTime = end;
      return { ...segment, startTime: start, endTime: end };
    });
  }, [segments, rehearsalStartTime]);

  const liveSegment = timeline.find((s) => s.status === "live");

  async function handleAddSegment() {
    if (!newTitle) return;

    const newSegment: Segment = {
      id: crypto.randomUUID(),
      title: newTitle,
      duration: parseInt(newDuration) || 5,
      notes: "",
      status: "pending",
    };

    const updatedSegments = [...segments, newSegment];
    await saveSegments(updatedSegments);

    setNewTitle("");
    toast.success("Segment added");
  }

  async function handleDelete(id: string) {
    const updatedSegments = segments.filter((s) => s.id !== id);
    await saveSegments(updatedSegments);
  }

  async function updateStatus(id: string, status: "pending" | "live" | "done") {
    const updatedSegments = segments.map((s) => {
      if (s.id === id) return { ...s, status };
      // If we setting one to live, others should be done if they were previous?
      // For simplicity, just update the target one, but usually "Live" implies others are not.
      if (status === "live" && s.status === "live" && s.id !== id)
        return { ...s, status: "done" as const };
      return s;
    });
    await saveSegments(updatedSegments);
  }

  async function saveSegments(newSegments: Segment[]) {
    // Optimistic update
    setSegments(newSegments);
    const newMetadata = {
      ...metadata,
      segments: newSegments,
    };
    await updateRehearsalMetadataAction(rehearsalId, farewellId, newMetadata);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Main Timeline (Left Col) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Run of Show</h2>
            <p className="text-sm text-muted-foreground">
              Detailed timeline and cues.
            </p>
          </div>
          {/* Total Duration Widget */}
          <div className="text-right">
            <div className="text-sm font-medium text-muted-foreground">
              Total Duration
            </div>
            <div className="font-mono text-lg">
              {segments.reduce((acc, curr) => acc + curr.duration, 0)} mins
            </div>
          </div>
        </div>

        {/* Quick Add Form */}
        {isAdmin && (
          <div className="flex gap-4 items-end bg-card p-4 rounded-xl border shadow-sm">
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Segment Title
              </span>
              <Input
                placeholder="e.g. Opening Scene, Warmup..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="w-24 space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Mins
              </span>
              <Input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button
              onClick={handleAddSegment}
              size="icon"
              className="shrink-0 mb-0.5"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Timeline List */}
        <div className="relative border-l-2 border-muted pl-6 space-y-8 py-2">
          {timeline.map((segment, index) => (
            <div
              key={segment.id}
              className={cn(
                "relative transition-all",
                segment.status === "done" && "opacity-60"
              )}
            >
              {/* Dot indicator */}
              <div
                className={cn(
                  "absolute -left-[31px] top-4 w-4 h-4 rounded-full border-4 border-background",
                  segment.status === "live"
                    ? "bg-red-500 ring-4 ring-red-500/20 w-5 h-5 -left-[33px]"
                    : segment.status === "done"
                    ? "bg-muted-foreground"
                    : "bg-primary"
                )}
              />

              <Card
                className={cn(
                  "p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all",
                  segment.status === "live"
                    ? "border-red-500 shadow-lg shadow-red-500/5 bg-red-50/5"
                    : "hover:border-primary/50"
                )}
              >
                {/* Time Block */}
                <div className="min-w-[80px] text-center sm:text-left border-b sm:border-b-0 sm:border-r border-border pb-2 sm:pb-0 sm:pr-4">
                  <div className="text-sm font-bold tabular-nums">
                    {format(segment.startTime, "HH:mm")}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {segment.duration}m
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-semibold text-lg truncate pr-2"
                      title={segment.title}
                    >
                      {segment.title}
                    </h3>
                    {segment.status === "live" && (
                      <Badge
                        variant="destructive"
                        className="animate-pulse shrink-0"
                      >
                        LIVE
                      </Badge>
                    )}
                    {segment.status === "done" && (
                      <Badge variant="secondary" className="shrink-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                      </Badge>
                    )}
                  </div>
                  {segment.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {segment.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {segment.status !== "live" && segment.status !== "done" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(segment.id, "live")}
                      >
                        <Play className="w-4 h-4 mr-2" /> Start
                      </Button>
                    )}
                    {segment.status === "live" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateStatus(segment.id, "done")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Finish
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(segment.id)}
                        >
                          <Trash className="w-4 h-4 mr-2" /> Delete Segment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </Card>
            </div>
          ))}

          {timeline.length === 0 && (
            <div className="text-center py-10 text-muted-foreground italic">
              No segments added yet. Use the form above to build the Run of
              Show.
            </div>
          )}
        </div>
      </div>

      {/* Live Focus (Right Col) - Sticky */}
      <div className="space-y-6">
        <div className="sticky top-24">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Current Focus
          </h3>

          {liveSegment ? (
            <Card className="p-6 border-red-500/50 bg-red-50/10 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl">
                On Air
              </div>
              <div className="space-y-4">
                <div>
                  <h2
                    className="text-2xl font-bold truncate max-w-full"
                    title={liveSegment.title}
                  >
                    {liveSegment.title}
                  </h2>
                  <p className="text-red-500 font-medium flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    Started at {format(liveSegment.startTime, "h:mm a")}
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border">
                  <span className="text-xs text-muted-foreground block mb-2">
                    UP NEXT
                  </span>
                  {(() => {
                    const nextIdx =
                      timeline.findIndex((s) => s.id === liveSegment.id) + 1;
                    const next = timeline[nextIdx];
                    return next ? (
                      <div className="font-medium flex justify-between items-center">
                        <span
                          className="truncate flex-1 mr-2"
                          title={next.title}
                        >
                          {next.title}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {next.duration}m
                        </span>
                      </div>
                    ) : (
                      <em className="text-muted-foreground text-sm">
                        End of show
                      </em>
                    );
                  })()}
                </div>

                {isAdmin && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => updateStatus(liveSegment.id, "done")}
                  >
                    Complete Segment
                    <SkipForward className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Pause className="w-6 h-6 opacity-50" />
              </div>
              <p>No active segment.</p>
              <p className="text-sm mt-1">
                Start a segment from the timeline to see it here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
