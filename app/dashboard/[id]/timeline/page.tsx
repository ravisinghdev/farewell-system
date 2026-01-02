import {
  getTimelineBlocksAction,
  getPerformancesAction,
  getEventDetailsAction,
} from "@/app/actions/event-actions";
import { TimelineBlock } from "@/types/timeline";
import { Performance } from "@/types/performance";
import TimelinePageClient from "@/components/timeline/timeline-page-client";

interface TimelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;

  // Parallel data fetching on Server
  const [blocksRes, perfRes, eventRes] = await Promise.all([
    getTimelineBlocksAction(id),
    getPerformancesAction(id),
    getEventDetailsAction(id),
  ]);

  const blocks = (blocksRes.data || []) as TimelineBlock[];
  const performances = (perfRes.data || []) as Performance[];
  const eventDetails = eventRes || null;

  return (
    <TimelinePageClient
      farewellId={id}
      initialBlocks={blocks}
      initialPerformances={performances}
      initialEventDetails={eventDetails}
    />
  );
}
