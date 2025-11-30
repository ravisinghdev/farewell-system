"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Play, Music2 } from "lucide-react";

export default function MusicLibraryPage() {
  return (
    <PageScaffold
      title="Music & Backgrounds"
      description="Curated playlist for the event and videos."
    >
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                <Music2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Sentimental Track {i}</h4>
                <p className="text-xs text-muted-foreground">
                  Unknown Artist • 3:45
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageScaffold>
  );
}
