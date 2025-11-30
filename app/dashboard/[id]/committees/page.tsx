"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function CommitteesPage() {
  return (
    <PageScaffold
      title="Organizing Committees"
      description="Manage teams and committee members."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Committee
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Core Team</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Responsible for overall planning and execution.
          </p>
          <div className="flex -space-x-2 overflow-hidden mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted"
              />
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background text-xs font-medium">
              +2
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            View Members
          </Button>
        </div>

        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Decoration</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Venue setup, stage design, and aesthetics.
          </p>
          <div className="flex -space-x-2 overflow-hidden mb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted"
              />
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full">
            View Members
          </Button>
        </div>
      </div>
    </PageScaffold>
  );
}
