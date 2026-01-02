"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { TimelineManager } from "@/components/timeline/timeline-manager";
import { useState } from "react";
import { createTimelineBlockAction } from "@/app/actions/event-actions";
import { TimelineBlock } from "@/types/timeline";
import { Performance } from "@/types/performance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Coffee } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TimelinePageClientProps {
  initialBlocks: TimelineBlock[];
  initialPerformances: Performance[];
  initialEventDetails: any;
  farewellId: string;
}

export default function TimelinePageClient({
  initialBlocks,
  initialPerformances,
  initialEventDetails,
  farewellId,
}: TimelinePageClientProps) {
  const router = useRouter();
  // We keep local state for optimistic updates / dnd, but initialize from server
  const [blocks, setBlocks] = useState<TimelineBlock[]>(initialBlocks);
  const [performances, setPerformances] =
    useState<Performance[]>(initialPerformances);

  // Filter acts that are NOT in the timeline yet
  const availablePerformances = performances.filter(
    (p) => !blocks.some((b) => b.performance_id === p.id)
  );

  async function handleAddToTimeline(p: Performance) {
    // Optimistic update
    const newIndex = blocks.length;

    // Server mutation
    await createTimelineBlockAction(farewellId, {
      type: "performance",
      title: p.title,
      performance_id: p.id,
      duration_seconds: p.duration_seconds || 300,
      order_index: newIndex,
    });

    // Refresh to get new ID/state
    router.refresh();
    toast.success("Added to Timeline");
  }

  async function handleAddBreak() {
    const newIndex = blocks.length;
    await createTimelineBlockAction(farewellId, {
      type: "break",
      title: "Break / Buffer",
      duration_seconds: 900, // 15 mins
      order_index: newIndex,
    });
    router.refresh();
    toast.success("Buffer Added");
  }

  return (
    <PageScaffold
      title="Smart Timeline"
      description="Drag and drop to sequence the event flow."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Main Timeline Column */}
        <div className="lg:col-span-2 overflow-y-auto pr-2">
          <TimelineManager
            initialBlocks={blocks}
            farewellId={farewellId}
            eventStartTime={
              initialEventDetails?.event_date
                ? `${initialEventDetails.event_date}T${
                    initialEventDetails.event_time || "17:00:00"
                  }`
                : undefined
            }
          />
        </div>

        {/* Sidebar Staging Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                Add to Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Available Acts</span>
                  <span className="bg-primary/10 text-primary px-1.5 rounded-full">
                    {availablePerformances.length}
                  </span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availablePerformances.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 border rounded bg-muted/20 text-sm"
                    >
                      <span className="truncate max-w-[150px]">{p.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleAddToTimeline(p)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {availablePerformances.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">
                      All acts scheduled.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs text-muted-foreground mb-2">
                  Non-Performance Blocks
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleAddBreak}
                >
                  <Coffee className="w-4 h-4" />
                  Add 15m Break
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageScaffold>
  );
}
