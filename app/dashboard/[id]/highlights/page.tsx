import { getHighlightsAction } from "@/app/actions/dashboard-actions";
import { CreateHighlightDialog } from "@/components/dashboard/create-highlight-dialog";
import { RealtimeHighlights } from "@/components/dashboard/realtime-highlights";
import { createClient } from "@/utils/supabase/server";
import { Star } from "lucide-react";

interface HighlightsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HighlightsPage({ params }: HighlightsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const highlights = await getHighlightsAction(id);

  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent">
      {/* Header Hero */}
      <div className="flex items-center justify-between p-8 border-b border-white/5 bg-gradient-to-r from-background via-background to-transparent z-10 sticky top-0 backdrop-blur-md">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-yellow-500">🌟</span>
            Highlights & Updates
          </h1>
          <p className="text-muted-foreground ml-1">
            A gallery of our best moments.
          </p>
        </div>
        {/* Create Dialog */}
        <CreateHighlightDialog farewellId={id} />
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-10">
        <div className="max-w-7xl mx-auto">
          <RealtimeHighlights initialHighlights={highlights} farewellId={id} />
        </div>
      </div>
    </div>
  );
}
