"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  TimelineEvent,
  getTimelineEventsAction,
} from "@/app/actions/dashboard-actions";
import { TimelineView } from "./timeline-view";
import { CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { TimelineEventDialog } from "./timeline-event-dialog";
import { Button } from "@/components/ui/button";

interface RealtimeTimelineProps {
  initialEvents: TimelineEvent[];
  farewellId: string;
  isAdmin: boolean;
}

export function RealtimeTimeline({
  initialEvents,
  farewellId,
  isAdmin,
}: RealtimeTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    const channel = supabase
      .channel("timeline-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timeline_events",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          console.log("Realtime update received for timeline");
          const newData = await getTimelineEventsAction(farewellId);
          setEvents(newData);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log("Timeline subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="h-20 w-20 rounded-full flex items-center justify-center bg-muted/20">
          <CalendarClock className="h-10 w-10 opacity-50 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No events scheduled</h3>
          <p className="max-w-sm text-muted-foreground">
            The timeline is currently empty.
            {isAdmin ? " Add an event to get started." : " Check back soon!"}
          </p>
          {isAdmin && (
            <div className="pt-2">
              <TimelineEventDialog
                farewellId={farewellId}
                trigger={<Button>Add First Event</Button>}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <TimelineView events={events} farewellId={farewellId} isAdmin={isAdmin} />
  );
}
