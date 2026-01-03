import { getHighlightsAction } from "@/app/actions/dashboard-actions";
import { CreateHighlightDialog } from "@/components/dashboard/create-highlight-dialog";
import { RealtimeHighlights } from "@/components/dashboard/realtime-highlights";
import { DashboardDataProvider } from "@/components/providers/dashboard-data-provider";
import { Star } from "lucide-react";

interface HighlightsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HighlightsPage({ params }: HighlightsPageProps) {
  const { id } = await params;

  // Fetch highlights directly (optimized)
  const highlights = await getHighlightsAction(id);

  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent">
      {/* Header Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 border-b border-white/5 z-10 sticky top-0 backdrop-blur-xl">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-yellow-500 text-3xl sm:text-4xl filter drop-shadow-lg">
              🌟
            </span>
            Highlights & Updates
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground ml-1 max-w-md">
            Capturing the best moments of our journey together.
          </p>
        </div>

        {/* Create Dialog - Full width on mobile, auto on desktop */}
        <div className="w-full sm:w-auto">
          <CreateHighlightDialog farewellId={id} />
        </div>
      </div>

      <div className="flex-1 overflow-auto pt-4 sm:p-10">
        <div className="max-w-7xl mx-auto">
          <DashboardDataProvider
            farewellId={id}
            highlights={highlights}
            stats={undefined as any}
            announcements={[]}
            recentTransactions={[]}
            timeline={[]}
          >
            <RealtimeHighlights
              initialHighlights={highlights}
              farewellId={id}
            />
          </DashboardDataProvider>
        </div>
      </div>
    </div>
  );
}
