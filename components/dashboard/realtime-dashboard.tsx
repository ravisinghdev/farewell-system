"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Announcement,
  getAnnouncementsAction,
  DashboardStats,
  getDashboardStatsAction,
} from "@/app/actions/dashboard-actions";
import { AnnouncementCard } from "./announcement-card";
import {
  Bell,
  Star,
  ImageIcon,
  Wallet,
  MessageCircle,
  Users,
  ArrowRight,
} from "lucide-react";
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
import { Countdown } from "@/components/dashboard/countdown";

interface RealtimeDashboardProps {
  initialAnnouncements: Announcement[];
  initialStats: DashboardStats;
  farewellId: string;
  farewellName: string;
  farewellYear: number;
  farewellDate: string | null;
}

export function RealtimeDashboard({
  initialAnnouncements,
  initialStats,
  farewellId,
  farewellName,
  farewellYear,
  farewellDate,
}: RealtimeDashboardProps) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const supabase = createClient();
  const router = useRouter();

  // Sync state with props
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
    setStats(initialStats);
  }, [initialAnnouncements, initialStats]);

  const refreshData = async () => {
    const [newAnnouncements, newStats] = await Promise.all([
      getAnnouncementsAction(farewellId),
      getDashboardStatsAction(farewellId),
    ]);
    setAnnouncements(newAnnouncements);
    setStats(newStats);
    router.refresh();
  };

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          console.log("Realtime: Announcements changed");
          refreshData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          console.log("Realtime: Contributions changed");
          refreshData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farewell_members",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          console.log("Realtime: Members changed");
          refreshData();
        }
      )
      // Note: Listening to chat_messages and media is harder because they are not directly on farewell_id
      // We would need to listen to all tables and filter client side or subscribe to specific channels/albums.
      // For simplicity, we will just listen to the global table changes and refresh if we can't filter easily?
      // Actually, Supabase Realtime requires a filter for performance usually.
      // Without filter, we get ALL messages for ALL channels. That's bad.
      // So for messages and media, we might not get "instant" updates unless we subscribe to specific IDs.
      // But we don't have the IDs here easily without fetching them.
      // A workaround is to subscribe to the table without filter but that's risky for scale.
      // OR, we just accept that messages/media stats update on page refresh or when other events happen.
      // Let's try to be smart: we can fetch the channel IDs and album IDs and subscribe to them?
      // Too complex for this component.
      // Let's just stick to the main ones for now, and maybe add a periodic refresh or just manual refresh.
      // OR, we can just listen to "announcements" and "contributions" and "members" which are the most important for "Dashboard".
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  const recentAnnouncements = announcements.slice(0, 2);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 md:p-12 text-primary-foreground shadow-xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-soft-light"></div>
        <div className="relative z-1 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {farewellName}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 font-medium">
              Class of {farewellYear} • Celebrating our journey together
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Link href={`/dashboard/${farewellId}/timeline`}>
                  View Timeline <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground"
              >
                <Link href={`/dashboard/${farewellId}/contributions`}>
                  Contribute Now
                </Link>
              </Button>
            </div>
          </div>

          {/* Countdown Card */}
          <div className="w-full max-w-sm bg-background/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="text-center mb-4">
              <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
                Countdown to Farewell
              </p>
            </div>
            {farewellDate ? (
              <Countdown targetDate={farewellDate} />
            ) : (
              <div className="text-center py-8 text-primary-foreground/60">
                Date to be announced
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Contributions"
          icon={Wallet}
          value={`₹${stats.contributions.toLocaleString()}`}
          subtext="Total collected"
          href={`/dashboard/${farewellId}/contributions`}
        />
        <StatsCard
          title="Messages"
          icon={MessageCircle}
          value={stats.messages.toString()}
          subtext="Total messages"
          href={`/dashboard/${farewellId}/messages`}
        />
        <StatsCard
          title="Gallery"
          icon={ImageIcon}
          value={stats.media.toString()}
          subtext="Photos uploaded"
          href={`/dashboard/${farewellId}/gallery`}
        />
        <StatsCard
          title="Members"
          icon={Users}
          value={stats.members.toString()}
          subtext="Joined so far"
          href={`/dashboard/${farewellId}/people`}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Recent Announcements */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Latest Announcements
            </h2>
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
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
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
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
              <Star className="h-6 w-6 text-yellow-500" />
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
              <div className="rounded-lg bg-muted aspect-video flex items-center justify-center text-muted-foreground">
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
    </div>
  );
}

function StatsCard({ title, icon: Icon, value, subtext, href }: any) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
