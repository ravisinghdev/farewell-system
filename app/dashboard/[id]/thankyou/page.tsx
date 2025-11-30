"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Heart, PenTool } from "lucide-react";

export default function ThankYouPage() {
  return (
    <PageScaffold
      title="Thank You Notes"
      description="Express gratitude to teachers, friends, and organizers."
      action={
        <Button>
          <PenTool className="mr-2 h-4 w-4" />
          Write Note
        </Button>
      }
    >
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        <div className="break-inside-avoid p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <Heart className="h-5 w-5 text-red-500 mb-3 fill-red-500/20" />
          <p className="text-sm leading-relaxed">
            "Thank you to the organizing committee for such a wonderful event.
            It was truly magical!"
          </p>
          <p className="mt-4 text-xs font-semibold text-right">- Priya S.</p>
        </div>

        <div className="break-inside-avoid p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <Heart className="h-5 w-5 text-red-500 mb-3 fill-red-500/20" />
          <p className="text-sm leading-relaxed">
            "To all my teachers, thank you for guiding me these past years. I
            wouldn't be here without you."
          </p>
          <p className="mt-4 text-xs font-semibold text-right">- Rohan D.</p>
        </div>
      </div>
    </PageScaffold>
  );
}
