"use client";

import { useMemo } from "react";
import { Duty } from "@/types/duties";
import { DutyBoard } from "@/components/duties/duty-board";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

interface RehearsalDutiesTabProps {
  rehearsalId: string;
  farewellId: string;
  duties: Duty[];
  currentUserRole: string;
  currentUserId: string;
}

export function RehearsalDutiesTab({
  rehearsalId,
  farewellId,
  duties,
  currentUserRole,
  currentUserId,
}: RehearsalDutiesTabProps) {
  // Filter duties relevant to this rehearsal
  // Logic: Duty description contains "Promoted from Run of Show" OR title contains "Rehearsal"
  // In a robust system, we would store rehearsal_id in metadata, but for now we do text matching + broad category
  const rehearsalDuties = useMemo(() => {
    return duties.filter((d) => {
      const isPromoted = d.description?.includes("Promoted from Run of Show");
      const isRehearsalCategory =
        d.category === "Rehearsal" ||
        d.title.toLowerCase().includes("rehearsal");
      return isPromoted || isRehearsalCategory;
    });
  }, [duties]);

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/5 border-primary/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-medium text-primary">
            Rehearsal & Performance Duties
          </h3>
          <p className="text-sm text-muted-foreground">
            These tasks are filtered to show only duties related to rehearsals
            or promoted from the Run of Show. Use this board to track expenses
            and assignments specific to this event.
          </p>
        </div>
      </Card>

      {rehearsalDuties.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
          <p>No duties linked to this rehearsal yet.</p>
          <p className="text-sm">
            Promote a segment from the Run of Show or create a duty with
            "Rehearsal" in the title.
          </p>
        </div>
      ) : (
        <DutyBoard
          initialDuties={rehearsalDuties}
          farewellId={farewellId}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
