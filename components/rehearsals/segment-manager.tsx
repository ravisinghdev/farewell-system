"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  Play,
  CheckCircle,
  SkipForward,
  MoreHorizontal,
  GripVertical,
  Plus,
} from "lucide-react";
import {
  createSegmentAction,
  updateSegmentStatusAction,
  deleteSegmentAction,
} from "@/app/actions/rehearsal-segment-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SegmentManagerProps {
  rehearsalId: string;
  farewellId: string;
  segments: any[];
  isAdmin: boolean;
  isLive: boolean; // If rehearsal is ongoing
}

export function SegmentManager({
  rehearsalId,
  farewellId,
  segments,
  isAdmin,
  isLive,
}: SegmentManagerProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("15");

  async function handleAddSegment() {
    if (!title) return;

    const result = await createSegmentAction(rehearsalId, farewellId, {
      title,
      duration_minutes: parseInt(duration),
      order_index: segments.length,
    });

    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      toast.success("Segment Added");
      setIsAddDialogOpen(false);
      setTitle("");
      setDuration("15");
      router.refresh();
    }
  }

  async function handleStatusChange(
    segmentId: string,
    status: "pending" | "running" | "completed" | "skipped"
  ) {
    const result = await updateSegmentStatusAction(
      segmentId,
      rehearsalId,
      farewellId,
      status
    );
    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      // optimized: maybe optimistic update?
      router.refresh();
    }
  }

  async function handleDelete(segmentId: string) {
    if (!confirm("Delete this segment?")) return;
    const result = await deleteSegmentAction(
      segmentId,
      rehearsalId,
      farewellId
    );
    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      router.refresh();
    }
  }

  // Calculate total duration
  const totalDuration = segments.reduce(
    (acc, curr) => acc + (curr.duration_minutes || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Run of Show</h3>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              Total Duration: {Math.floor(totalDuration / 60)}h{" "}
              {totalDuration % 60}m
            </span>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add Segment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Segment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Opening Dance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSegment}>Create Segment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {segments.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/10 text-muted-foreground text-sm">
            No segments defined. Add segments to structure the rehearsal.
          </div>
        ) : (
          segments.map((segment, index) => (
            <Card
              key={segment.id}
              className={cn(
                "transition-all",
                segment.status === "running" &&
                  "border-primary ring-1 ring-primary shadow-md bg-accent/5",
                segment.status === "completed" && "opacity-70 bg-muted/20"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-muted-foreground font-mono text-xs w-6 text-center">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{segment.title}</h4>
                    {segment.status === "running" && (
                      <Badge className="bg-green-600 animate-pulse h-5 text-[10px]">
                        LIVE
                      </Badge>
                    )}
                    {segment.status === "completed" && (
                      <Badge variant="secondary" className="h-5 text-[10px]">
                        Done
                      </Badge>
                    )}
                    {segment.status === "skipped" && (
                      <Badge variant="destructive" className="h-5 text-[10px]">
                        Skipped
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{segment.duration_minutes}m</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    {isLive &&
                      segment.status !== "completed" &&
                      segment.status !== "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() =>
                            handleStatusChange(segment.id, "running")
                          }
                        >
                          <Play className="w-3 h-3 mr-1" /> Start
                        </Button>
                      )}
                    {isLive && segment.status === "running" && (
                      <Button
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleStatusChange(segment.id, "completed")
                        }
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Done
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleDelete(segment.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
