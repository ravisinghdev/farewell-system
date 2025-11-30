"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Music, Mic2 } from "lucide-react";

export default function PerformancesPage() {
  return (
    <PageScaffold
      title="Performances & Acts"
      description="Manage dance, music, and drama performances."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Performance
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Items */}
        <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
                <Music className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Group Dance</h3>
                <p className="text-sm text-muted-foreground">
                  12th Grade Girls
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">5 mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-500/10 text-yellow-600">
                  Rehearsing
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                <Mic2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Solo Song</h3>
                <p className="text-sm text-muted-foreground">Rahul K.</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">3 mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/10 text-green-600">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
