"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Announcement,
  getAnnouncementsAction,
} from "@/app/actions/dashboard-actions";
import { AnnouncementCard } from "./announcement-card";
import { Bell, Star, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface RealtimeDashboardOverviewProps {
  initialAnnouncements: Announcement[];
  farewellId: string;
}

export function RealtimeDashboardOverview({
  initialAnnouncements,
  farewellId,
}: RealtimeDashboardOverviewProps) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-overview-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          console.log("Realtime update received for dashboard overview");
          const newData = await getAnnouncementsAction(farewellId);
          setAnnouncements(newData);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log("Dashboard overview subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  const recentAnnouncements = announcements.slice(0, 2);

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* Recent Announcements */}
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Latest Announcements
          </h2>
          <Button variant="ghost" asChild className="">
            <Link href={`/dashboard/${farewellId}/announcements`}>
              View All
            </Link>
          </Button>
        </div>

        {recentAnnouncements.length > 0 ? (
          <div className="grid gap-4">
            {recentAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p>No announcements yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links / Highlights Preview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6" />
            Highlights
          </h2>
        </div>

        <Card className="bg-gradient-to-br from-card to-muted/50 border-none shadow-md h-full">
          <CardHeader>
            <CardTitle>Don't Miss Out!</CardTitle>
            <CardDescription>
              Check out the latest updates and featured content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg aspect-video flex items-center justify-center">
              <ImageIcon className="h-10 w-10 opacity-20" />
            </div>
            <Button asChild className="w-full">
              <Link href={`/dashboard/${farewellId}/highlights`}>
                Explore Highlights
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
