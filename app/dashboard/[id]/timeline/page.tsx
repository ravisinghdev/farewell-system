import { getTimelineEventsAction } from "@/app/actions/dashboard-actions";
import { TimelineEventDialog } from "@/components/dashboard/timeline-event-dialog";
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

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: member } = await supabase
      .from("farewell_members")
      .select("role")
      .eq("farewell_id", id)
      .eq("user_id", user.id)
      .single();

    if (member?.role === "main_admin" || member?.role === "parallel_admin") {
      isAdmin = true;
    }
  }

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
        {isAdmin && <TimelineEventDialog farewellId={id} />}
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-10">
        <div className="max-w-5xl mx-auto">
          <RealtimeTimeline
            initialEvents={events}
            farewellId={id}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
