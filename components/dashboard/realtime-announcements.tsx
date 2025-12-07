"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Announcement,
  getAnnouncementsAction,
} from "@/app/actions/dashboard-actions";
import { AnnouncementCard } from "./announcement-card";
import { Bell } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

import { useFarewell } from "@/components/providers/farewell-provider";

interface RealtimeAnnouncementsProps {
  initialAnnouncements: Announcement[];
  filter?: "all" | "pinned" | "recent";
  // Props are now optional/unused as we use context
  farewellId?: string;
  isAdmin?: boolean;
  userId?: string;
}

export function RealtimeAnnouncements({
  initialAnnouncements,
  filter = "all",
}: RealtimeAnnouncementsProps) {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;

  useRealtimeSubscription({
    table: "announcements",
    filter: `farewell_id=eq.${farewellId}`,
  });

  // We can just use the prop directly since router.refresh() will update it
  const announcements = initialAnnouncements;

  // 1. Separate Pinned vs Regular
  const pinnedAnnouncements = announcements.filter((a) => a.is_pinned);
  const regularAnnouncements = announcements.filter((a) => !a.is_pinned);

  // 2. Apply filters to regular list
  const filteredRegular = regularAnnouncements.filter((announcement) => {
    // If filter is "pinned", we don't show regular ones
    if (filter === "pinned") return false;

    if (filter === "recent") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(announcement.created_at) > sevenDaysAgo;
    }
    return true; // "all" filter
  });

  // If filter is specific to "pinned", show ONLY pinned
  const displayList =
    filter === "pinned" ? pinnedAnnouncements : filteredRegular;
  const showPinnedSection =
    filter !== "pinned" && pinnedAnnouncements.length > 0;

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center">
          <Bell className="h-10 w-10 opacity-30" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold opacity-70">
            No announcements yet
          </h3>
          <p className="max-w-sm text-muted-foreground">
            The organizers haven't posted any updates yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Pinned Section */}
      {showPinnedSection && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary px-1">
            Featured Updates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pinnedAnnouncements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} isFeatured />
            ))}
          </div>
        </div>
      )}

      {/* Regular Filtered Grid */}
      <div className="space-y-4">
        {showPinnedSection && displayList.length > 0 && (
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground px-1 opacity-70">
            Recent
          </h3>
        )}

        {displayList.length === 0 && !showPinnedSection ? (
          <div className="text-center py-10 opacity-50">
            No announcements match this filter.
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {displayList.map((announcement, index) => (
              <div
                key={announcement.id}
                className="break-inside-avoid animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <AnnouncementCard announcement={announcement} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
