"use client";

import { Announcement } from "@/app/actions/dashboard-actions";
import { RealtimeAnnouncements } from "@/components/dashboard/realtime-announcements";
import { Button } from "@/components/ui/button";
import { Bell, Filter } from "lucide-react";
import { useState } from "react";
import { CreateAnnouncementDialog } from "@/components/dashboard/create-announcement-dialog";

import { useFarewell } from "@/components/providers/farewell-provider";

interface AnnouncementsClientProps {
  announcements: Announcement[];
  // Props are now optional/unused as we use context
  farewellId?: string;
  isAdmin?: boolean;
  userId?: string;
}

export default function AnnouncementsClient({
  announcements,
}: AnnouncementsClientProps) {
  const { user, farewell, isAdmin } = useFarewell();
  const farewellId = farewell.id;
  const userId = user.id;
  const [filter, setFilter] = useState<"all" | "pinned" | "recent">("all");

  const filters = [
    { value: "all" as const, label: "All", count: announcements.length },
    {
      value: "pinned" as const,
      label: "Pinned",
      count: announcements.filter((a) => a.is_pinned).length,
    },
    {
      value: "recent" as const,
      label: "Recent",
      count: announcements.filter((a) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(a.created_at) > sevenDaysAgo;
      }).length,
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Filter Toolbar */}
      <div className="flex items-center gap-4 bg-background/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 w-fit">
        <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground border-r border-white/10 pr-4">
          <Filter className="h-4 w-4" />
          <span className="font-medium hidden sm:inline">Filter</span>
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={`gap-2 rounded-xl text-xs h-8 ${
                filter === f.value
                  ? "bg-white/10 text-primary font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              {f.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === f.value
                    ? "bg-primary/20 text-primary"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                {f.count}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <RealtimeAnnouncements
          initialAnnouncements={announcements}
          farewellId={farewellId}
          filter={filter}
          isAdmin={isAdmin}
          userId={userId}
        />
      </div>
    </div>
  );
}
