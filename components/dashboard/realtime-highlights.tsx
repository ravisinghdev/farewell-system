"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Highlight,
  getHighlightsAction,
} from "@/app/actions/dashboard-actions";
import { HighlightCard } from "./highlight-card";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface RealtimeHighlightsProps {
  initialHighlights: Highlight[];
  farewellId: string;
}

export function RealtimeHighlights({
  initialHighlights,
  farewellId,
}: RealtimeHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setHighlights(initialHighlights);
  }, [initialHighlights]);

  useEffect(() => {
    const channel = supabase
      .channel("highlights-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "highlights",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          console.log("Realtime update received for highlights");
          const newData = await getHighlightsAction(farewellId);
          setHighlights(newData);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log("Highlights subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="h-20 w-20 rounded-full flex items-center justify-center">
          <Star className="h-10 w-10 opacity-50" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No highlights yet</h3>
          <p className="max-w-sm">
            Stay tuned for featured content and updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {highlights.map((highlight) => (
        <HighlightCard key={highlight.id} highlight={highlight} />
      ))}
    </div>
  );
}
