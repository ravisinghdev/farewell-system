import { getTimelineEventsAction } from "@/app/actions/dashboard-actions";
import { CreateEventDialog } from "@/components/dashboard/create-event-dialog";
import { RealtimeTimeline } from "@/components/dashboard/realtime-timeline";
import { createClient } from "@/utils/supabase/server";
import { CalendarClock } from "lucide-react";

interface TimelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Sort events by date
  const events = (await getTimelineEventsAction(id)).sort(
    (a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent">
      {/* Header Hero */}
      <div className="flex items-center justify-between p-8 border-b border-white/5 bg-gradient-to-r from-background via-background to-transparent z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            Farewell Schedule
          </h1>
          <p className="text-muted-foreground ml-1">
            Don't miss a moment. Here is the plan.
          </p>
        </div>
        <CreateEventDialog farewellId={id} />
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-10">
        <div className="max-w-5xl mx-auto">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
                <CalendarClock className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                  No events scheduled
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  The timeline is currently empty. Check back soon for updates!
                </p>
              </div>
            </div>
          ) : (
            <RealtimeTimeline initialEvents={events} farewellId={id} />
          )}
        </div>
      </div>
    </div>
  );
}
