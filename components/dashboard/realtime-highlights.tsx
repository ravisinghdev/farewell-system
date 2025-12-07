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
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center animate-in zoom-in-50 duration-500">
          <Star className="h-10 w-10 opacity-30 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold opacity-70">
            No highlights yet
          </h3>
          <p className="max-w-sm text-muted-foreground">
            Stay tuned for featured content and updates.
          </p>
        </div>
      </div>
    );
  }

  // Feature the first highlight as Hero
  const heroHighlight = highlights[0];
  const gridHighlights = highlights.slice(1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* 1. Hero Highlight */}
      <div className="w-full">
        <HighlightCard highlight={heroHighlight} isHero={true} />
      </div>

      {/* 2. Grid Highlights */}
      {gridHighlights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridHighlights.map((highlight, index) => (
            <div
              key={highlight.id}
              className="animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <HighlightCard highlight={highlight} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
