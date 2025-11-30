import { getTimelineEventsAction } from "@/app/actions/dashboard-actions";
import { CreateEventDialog } from "@/components/dashboard/create-event-dialog";
import { RealtimeTimeline } from "@/components/dashboard/realtime-timeline";
import { createClient } from "@/utils/supabase/server";
import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import { getFarewellRole } from "@/lib/auth/claims";

interface TimelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const events = await getTimelineEventsAction(id);
  const role = getFarewellRole(user, id);
  const isAdmin = role === "parallel_admin" || role === "main_admin";

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Farewell Timeline
          </h1>
          <p className="text-sm text-muted-foreground">
            The schedule of events leading up to the big day.
          </p>
        </div>
        {isAdmin && <CreateEventDialog farewellId={id} />}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {events.length === 0 ? (
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
          ) : (
            <RealtimeTimeline initialEvents={events} farewellId={id} />
          )}
        </div>
      </div>
    </div>
  );
}
