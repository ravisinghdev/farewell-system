"use client";

import { useEffect, useState, useTransition, useOptimistic } from "react";
import {
  Announcement,
  togglePinAnnouncementAction,
} from "@/app/actions/dashboard-actions";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { useFarewell } from "@/components/providers/farewell-provider";
import { AnnouncementListItem } from "./announcement-list-item";
import { AnnouncementDetailView } from "./announcement-detail-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RealtimeAnnouncementsProps {
  initialAnnouncements: Announcement[];
  filter?: "all" | "pinned" | "recent";
  farewellId?: string; // Optional (unused)
  isAdmin?: boolean; // Optional (unused)
  userId?: string; // Optional (unused)
}

export function RealtimeAnnouncements({
  initialAnnouncements,
  filter = "all",
}: RealtimeAnnouncementsProps) {
  const { farewell } = useFarewell();
  const farewellId = farewell.id;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [optimisticAnnouncements, addOptimisticAnnouncement] = useOptimistic(
    initialAnnouncements,
    (state, updatedAnnouncement: { id: string; is_pinned: boolean }) =>
      state.map((a) =>
        a.id === updatedAnnouncement.id
          ? { ...a, is_pinned: updatedAnnouncement.is_pinned }
          : a
      )
  );

  useRealtimeSubscription({
    table: "announcements",
    filter: `farewell_id=eq.${farewellId}`,
  });

  // Client-side filtering logic
  const filteredAnnouncements = optimisticAnnouncements
    .filter((a) => {
      // 1. Text Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesContent = a.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      // 2. Tab Filter
      if (filter === "pinned" && !a.is_pinned) return false;
      if (filter === "recent") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(a.created_at) <= sevenDaysAgo) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by pinned (true first)
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      // Then by date (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  // Handle Pin Toggle directly from list
  const handleTogglePin = (
    e: React.MouseEvent,
    id: string,
    currentStatus: boolean
  ) => {
    e.stopPropagation();
    startTransition(async () => {
      addOptimisticAnnouncement({ id, is_pinned: !currentStatus });
      const res = await togglePinAnnouncementAction(
        id,
        farewellId,
        !currentStatus
      );
      if (res.error) toast.error(res.error);
    });
  };

  const selectedAnnouncement =
    initialAnnouncements.find((a) => a.id === selectedId) || null;

  return (
    // Use a calculated height that accounts for the header, padding, and some bottom space
    // roughly: 100vh - header (4rem) - padding/hero (varies) - safe area
    <div className="flex h-[calc(100vh-140px)] w-full gap-4 relative">
      {/* 
           LEFT PANE: LIST 
           Hidden on mobile if item is selected
       */}
      <div
        className={cn(
          "flex-1 md:flex-none md:w-[400px] lg:w-[450px] flex flex-col bg-background/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden transition-all duration-300",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {/* List Header / Search */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02] shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 focus:bg-background"
            />
          </div>
        </div>

        {/* 
            Native scroll for robustness as requested ("overflow auto")
            ScrollArea from shadcn can sometimes fight with flex containers if not perfectly sized 
        */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col">
            {filteredAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No announcements found.
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <AnnouncementListItem
                  key={announcement.id}
                  announcement={announcement}
                  isSelected={selectedId === announcement.id}
                  onSelect={() => setSelectedId(announcement.id)}
                  onTogglePin={(e) =>
                    handleTogglePin(e, announcement.id, announcement.is_pinned)
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 
           RIGHT PANE: DETAIL 
           Full width on mobile if selected, otherwise hidden
       */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 h-full overflow-hidden",
          !selectedId
            ? "hidden md:flex"
            : "flex absolute inset-0 md:static z-20 md:z-auto"
        )}
      >
        <AnnouncementDetailView
          announcement={selectedAnnouncement}
          onBack={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
