"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import { getQuotesAction } from "@/app/actions/legacy-actions";

export function QuotesList({
  initialQuotes,
  farewellId,
}: {
  initialQuotes: any[];
  farewellId: string;
}) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  useEffect(() => {
    const channel = supabase
      .channel("legacy_quotes_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legacy_quotes",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          // Fetch new data directly to ensure immediate update
          const newData = await getQuotesAction(farewellId);
          setQuotes(newData);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, farewellId, router]);

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Quote className="h-12 w-12 mb-4 opacity-20" />
        <p>No quotes added yet. Be the first to add one!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {quotes.map((quote) => (
        <div
          key={quote.id}
          className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm relative hover:shadow-md transition-shadow"
        >
          <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10 rotate-180" />
          <blockquote className="mt-4 text-lg italic font-medium text-center relative z-10">
            "{quote.content}"
          </blockquote>
          <div className="mt-4 text-center relative z-10">
            <p className="text-sm font-semibold">{quote.author}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submitted by {quote.submitted_by?.full_name || "Unknown"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
