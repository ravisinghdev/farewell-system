"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Play, Clock, Trash } from "lucide-react";
import { updateRehearsalMetadataAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Segment {
  id: string;
  title: string;
  duration: number; // minutes
  notes: string;
  status: "pending" | "live" | "done";
}

interface SegmentManagerProps {
  rehearsalId: string;
  farewellId: string;
  segments: Segment[]; // From metadata.segments
  metadata: any;
  isAdmin: boolean;
  isLive: boolean;
}

export function SegmentManager({
  rehearsalId,
  farewellId,
  segments: initialSegments,
  metadata,
  isAdmin,
}: SegmentManagerProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments || []);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("5");

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

  async function handlePlay(id: string) {
    // Set all others to done/pending, this one to live
    const updatedSegments = segments.map((s) => ({
      ...s,
      status: (s.id === id
        ? "live"
        : s.status === "live"
        ? "done"
        : s.status) as any,
    }));
    await saveSegments(updatedSegments);
  }

  async function saveSegments(newSegments: Segment[]) {
    setSegments(newSegments);
    const newMetadata = {
      ...metadata,
      segments: newSegments,
    };
    await updateRehearsalMetadataAction(rehearsalId, farewellId, newMetadata);
  }

  return (
    <div className="space-y-6">
      {/* Input Area */}
      {isAdmin && (
        <div className="flex gap-2 items-end bg-muted/30 p-4 rounded-lg">
          <div className="flex-1 space-y-2">
            <span className="text-sm font-medium">Segment Title</span>
            <Input
              placeholder="e.g. Warm up, Scene 1..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="w-24 space-y-2">
            <span className="text-sm font-medium">Mins</span>
            <Input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
            />
          </div>
          <Button onClick={handleAddSegment}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      )}

      {/* Timeline List */}
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <Card
            key={segment.id}
            className={`p-4 flex items-center justify-between transition-all ${
              segment.status === "live"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground font-mono w-6 text-center">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  {segment.title}
                  {segment.status === "live" && (
                    <Badge variant="default" className="text-[10px] h-4 px-1">
                      LIVE
                    </Badge>
                  )}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  {segment.duration} mins
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={
                      segment.status === "live"
                        ? "text-primary animate-pulse"
                        : "text-muted-foreground"
                    }
                    onClick={() => handlePlay(segment.id)}
                    title="Set Live"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(segment.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}

        {segments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            No segments added. Create the Run of Show above.
          </div>
        )}
      </div>
    </div>
  );
}
