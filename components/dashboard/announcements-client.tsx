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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                Announcements
              </h1>
              <p className="text-sm text-muted-foreground">
                Stay updated with the latest news and important information
              </p>
            </div>
            {isAdmin && (
              <div className="w-full md:w-auto">
                <CreateAnnouncementDialog farewellId={farewellId} />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filter:</span>
            </div>
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="gap-2"
              >
                {f.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    filter === f.value
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <RealtimeAnnouncements
            initialAnnouncements={announcements}
            farewellId={farewellId}
            filter={filter}
            isAdmin={isAdmin}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
