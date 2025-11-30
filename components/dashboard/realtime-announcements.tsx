"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Announcement,
  getAnnouncementsAction,
} from "@/app/actions/dashboard-actions";
import { AnnouncementCard } from "./announcement-card";
import { Bell } from "lucide-react";

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
  const userId = user.id;
  const isAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const supabase = createClient();

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  useEffect(() => {
    const channel = supabase
      .channel(`announcements-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async (payload) => {
          console.log("🔔 Realtime event:", payload.eventType, payload);

          // Fetch fresh data for INSERT and UPDATE
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newData = await getAnnouncementsAction(farewellId);
            setAnnouncements(newData);
          }
          // Optimistically remove for DELETE
          else if (payload.eventType === "DELETE") {
            setAnnouncements((prev) =>
              prev.filter((a) => a.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime connected for announcements");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime connection error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase]);

  // Filter announcements based on filter prop
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === "pinned") {
      return announcement.is_pinned;
    }
    if (filter === "recent") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(announcement.created_at) > sevenDaysAgo;
    }
    return true; // "all" filter
  });

  if (filteredAnnouncements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            {filter === "pinned"
              ? "No pinned announcements"
              : filter === "recent"
              ? "No recent announcements"
              : "No announcements yet"}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {filter === "all"
              ? "Check back later for updates from the organizers."
              : "Try changing the filter to see more announcements."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {filteredAnnouncements.map((announcement, index) => (
        <div
          key={announcement.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <AnnouncementCard announcement={announcement} />
        </div>
      ))}
    </div>
  );
}
