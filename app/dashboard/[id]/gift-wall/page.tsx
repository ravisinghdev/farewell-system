"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Gift, Send } from "lucide-react";

export default function GiftWallPage() {
  return (
    <PageScaffold
      title="Gift & Wishes Wall"
      description="Send virtual gifts and best wishes."
      action={
        <Button>
          <Gift className="mr-2 h-4 w-4" />
          Send Gift
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-200/20 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-2xl">
              🎁
            </div>
            <span className="text-xs text-muted-foreground">2 mins ago</span>
          </div>
          <p className="mt-4 font-medium">
            "Best of luck for your future endeavors!"
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <span>From: Anjali M.</span>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200/20 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
              🎓
            </div>
            <span className="text-xs text-muted-foreground">1 hour ago</span>
          </div>
          <p className="mt-4 font-medium">"We will miss you! Keep shining."</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <span>From: Mr. Sharma</span>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
