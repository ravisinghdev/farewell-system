"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function RehearsalsPage() {
  return (
    <PageScaffold
      title="Rehearsals & Planning"
      description="Track rehearsal schedules and attendance."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Rehearsal
        </Button>
      }
    >
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <span className="text-4xl">📅</span>
        </div>
        <h3 className="text-xl font-semibold">No Rehearsals Scheduled</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Start planning by scheduling your first rehearsal session for
          performances and speeches.
        </p>
      </div>
    </PageScaffold>
  );
}
