"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { getThankYouNotesAction } from "@/app/actions/legacy-actions";

export function ThankYouList({
  initialNotes,
  farewellId,
}: {
  initialNotes: any[];
  farewellId: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    const channel = supabase
      .channel("legacy_thank_you_notes_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legacy_thank_you_notes",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          const newData = await getThankYouNotesAction(farewellId);
          setNotes(newData);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, farewellId, router]);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Heart className="h-12 w-12 mb-4 opacity-20" />
        <p>No thank you notes yet. Be the first to write one!</p>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {notes.map((note) => (
        <div
          key={note.id}
          className="break-inside-avoid p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <Heart className="h-5 w-5 text-red-500 fill-red-500/20" />
            {note.recipient_name && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
                To: {note.recipient_name}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">"{note.content}"</p>
          <p className="mt-4 text-xs font-semibold text-right text-muted-foreground">
            - {note.author_id?.full_name || "Anonymous"}
          </p>
        </div>
      ))}
    </div>
  );
}
