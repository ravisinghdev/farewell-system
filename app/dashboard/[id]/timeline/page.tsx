"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { TimelineManager } from "@/components/timeline/timeline-manager";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFarewell } from "@/components/providers/farewell-provider";
import {
  getTimelineBlocksAction,
  getPerformancesAction,
  getEventDetailsAction,
  createTimelineBlockAction,
} from "@/app/actions/event-actions";
import { TimelineBlock } from "@/types/timeline";
import { Performance } from "@/types/performance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Coffee } from "lucide-react";
import { toast } from "sonner";

export default function TimelinePage() {
  const params = useParams();
  const farewellId = params.id as string;
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [farewellId]);

  async function loadData() {
    const [blocksRes, perfRes, eventRes] = await Promise.all([
      getTimelineBlocksAction(farewellId),
      getPerformancesAction(farewellId),
      getEventDetailsAction(farewellId),
    ]);

    if (blocksRes.data) setBlocks(blocksRes.data as unknown as TimelineBlock[]);
    if (perfRes.data) setPerformances(perfRes.data as unknown as Performance[]);
    if (eventRes) setEventDetails(eventRes);

    setLoading(false);
  }

  // Filter acts that are NOT in the timeline yet
  const availablePerformances = performances.filter(
    (p) => !blocks.some((b) => b.performance_id === p.id)
  );

  async function handleAddToTimeline(p: Performance) {
    const newIndex = blocks.length;
    await createTimelineBlockAction(farewellId, {
      type: "performance",
      title: p.title,
      performance_id: p.id,
      duration_seconds: p.duration_seconds || 300,
      order_index: newIndex,
    });
    loadData(); // Reload
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
    loadData();
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
          {loading ? (
            <div>Loading timeline...</div>
          ) : (
            <TimelineManager
              initialBlocks={blocks}
              farewellId={farewellId}
              eventStartTime={
                eventDetails?.event_date
                  ? `${eventDetails.event_date}T${
                      eventDetails.event_time || "17:00:00"
                    }`
                  : undefined
              }
            />
          )}
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
