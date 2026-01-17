"use client";

import { TimelineManager } from "@/components/timeline/timeline-manager";
import { useState } from "react";
import { TimelineBlock } from "@/types/timeline";
import { useRouter } from "next/navigation";
import { FreshTimelineView } from "@/components/timeline/fresh-timeline-view";
import { Sparkles, Settings2, CalendarClock } from "lucide-react"; // Added CalendarClock
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEventDetailsAction } from "@/app/actions/event-actions";
import { toast } from "sonner";

interface TimelinePageClientProps {
  initialBlocks: TimelineBlock[];
  initialEventDetails: any;
  farewellId: string;
}

export default function TimelinePageClient({
  initialBlocks,
  initialEventDetails,
  farewellId,
}: TimelinePageClientProps) {
  const router = useRouter();
  // We directly use the server data which is refreshed via router.refresh()
  const blocks = initialBlocks;

  const [viewMode, setViewMode] = useState<"visual" | "manage">("visual");

  // Event Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [eventDate, setEventDate] = useState(
    initialEventDetails?.event_date || ""
  );
  const [eventTime, setEventTime] = useState(
    initialEventDetails?.event_time || ""
  );

  async function handleSaveSettings() {
    const res = await updateEventDetailsAction(farewellId, {
      event_date: eventDate,
      event_time: eventTime,
    });
    if (res.error) {
      toast.error("Failed to update settings", { description: res.error });
    } else {
      toast.success("Settings updated");
      setIsSettingsOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
          <p className="text-muted-foreground">
            Manage the show flow or view the journey.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Settings Dialog */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarClock className="w-4 h-4" />
                Event Start
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Event Start Time</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Event Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="bg-muted p-1 rounded-lg inline-flex self-start md:self-auto">
            <button
              onClick={() => setViewMode("visual")}
              className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "visual"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Journey
            </button>
            <button
              onClick={() => setViewMode("manage")}
              className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "manage"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Manage
            </button>
          </div>
        </div>
      </div>

      {viewMode === "visual" ? (
        <FreshTimelineView blocks={blocks} eventDetails={initialEventDetails} />
      ) : (
        <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2">
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
      )}
    </div>
  );
}
