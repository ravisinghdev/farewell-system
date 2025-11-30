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

interface RealtimeTimelineProps {
  initialEvents: TimelineEvent[];
  farewellId: string;
}

export function RealtimeTimeline({
  initialEvents,
  farewellId,
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
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No events scheduled</h3>
          <p className="text-muted-foreground max-w-sm">
            The timeline is currently empty. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return <TimelineView events={events} />;
}
