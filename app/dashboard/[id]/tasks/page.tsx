"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle } from "lucide-react";

export default function TasksPage() {
  return (
    <PageScaffold
      title="Event Task Board"
      description="Kanban board for tracking event preparations."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
        {/* To Do Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              To Do
            </h3>
            <span className="bg-muted text-xs px-2 py-0.5 rounded-full font-medium">
              3
            </span>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <p className="font-medium text-sm">Finalize Guest List</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span className="bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                  High
                </span>
                <span>Due in 2 days</span>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <p className="font-medium text-sm">Book Photographer</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded">
                  Medium
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-500">
              In Progress
            </h3>
            <span className="bg-blue-500/20 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
              1
            </span>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <p className="font-medium text-sm">Venue Decoration Planning</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  <div className="h-5 w-5 rounded-full bg-gray-300 border border-white" />
                  <div className="h-5 w-5 rounded-full bg-gray-400 border border-white" />
                </div>
                <span>2 assignees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Done Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-green-500">
              Done
            </h3>
            <span className="bg-green-500/20 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">
              2
            </span>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-card/50 shadow-sm opacity-70">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="font-medium text-sm line-through">
                  Create Budget
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card/50 shadow-sm opacity-70">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="font-medium text-sm line-through">
                  Send Invitations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
