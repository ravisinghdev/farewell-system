"use client";

import { Button } from "@/components/ui/button";
import { Coffee, Megaphone, Save, Plus, Play, Download } from "lucide-react";
import { useTimeline } from "@/components/providers/timeline-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TimelineControls() {
  const { hasChanges, isSaving, saveOrder, addBlock } = useTimeline();

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl border mb-4">
      {/* Quick Adds */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs font-medium"
          onClick={() => addBlock("break", "Short Break", 900)}
        >
          <Coffee className="w-3.5 h-3.5 text-amber-500" />
          Add Break
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs font-medium"
          onClick={() => addBlock("announcement", "Announcement", 300)}
        >
          <Megaphone className="w-3.5 h-3.5 text-purple-500" />
          Announce
        </Button>
      </div>

      <div className="flex-1" />

      {/* Save Action */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
          <Download className="w-3.5 h-3.5" />
          PDF
        </Button>

        <Button
          onClick={saveOrder}
          disabled={!hasChanges || isSaving}
          size="sm"
          className={cn(
            "h-8 gap-2 text-xs transition-all duration-300",
            hasChanges
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 w-28"
              : "bg-muted text-muted-foreground hover:bg-muted/80 w-20 opacity-50"
          )}
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}




