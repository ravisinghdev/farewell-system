"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Announcement,
  DashboardStats,
  Highlight,
  getAnnouncementsAction,
  getDashboardStatsAction,
  getRecentTransactionsAction,
  getHighlightsAction,
} from "@/app/actions/dashboard-actions";
import {
  Bell,
  Wallet,
  ImageIcon,
  MessageSquare,
  Users,
  Clock,
  Sparkles,
  Heart,
  TrendingUp,
  ArrowRight,
  Plus,
  Settings,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Countdown } from "@/components/dashboard/countdown";
import { useFarewell } from "@/components/providers/farewell-provider";
import {
  GlassCard,
  StatWidget,
  QuickAction,
  LiveTickerItem,
} from "./dashboard-widgets";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ModernDashboardProps {
  initialAnnouncements: Announcement[];
  initialStats: DashboardStats;
  initialTransactions: any[];
  initialHighlights: Highlight[];
  farewellId: string;
  farewellName: string;
  farewellDate: string | null;
}

export function ModernDashboard({
  initialAnnouncements,
  initialStats,
  initialTransactions,
  initialHighlights,
  farewellId,
  farewellName,
  farewellDate,
}: ModernDashboardProps) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);

  const supabase = createClient();
  const router = useRouter();
  const { user } = useFarewell();

  /* ---------------- Sync initial props ---------------- */
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
    setStats(initialStats);
    setTransactions(initialTransactions);
    setHighlights(initialHighlights);
  }, [
    initialAnnouncements,
    initialStats,
    initialTransactions,
    initialHighlights,
  ]);

  /* ---------------- Data Refresh ---------------- */
  const refreshData = async () => {
    const [a, s, t, h] = await Promise.all([
      getAnnouncementsAction(farewellId),
      getDashboardStatsAction(farewellId),
      getRecentTransactionsAction(farewellId),
      getHighlightsAction(farewellId),
    ]);

    setAnnouncements(a);
    setStats(s);
    setTransactions(t);
    setHighlights(h as Highlight[]);
    router.refresh();
  };

  /* ---------------- Realtime ---------------- */
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-modern")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          filter: `farewell_id=eq.${farewellId}`,
        },
        refreshData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  /* ---------------- Derived UI ---------------- */
  const spotlightItem = highlights[0] ?? null;

  const pulseItems = [
    ...announcements.slice(0, 3).map((a) => ({
      id: `a-${a.id}`,
      text: a.title,
      time: "Just now",
      icon: Bell,
    })),
    ...transactions.slice(0, 5).map((t) => ({
      id: `t-${t.id}`,
      text: `${
        t.metadata?.is_anonymous ? "Someone" : t.users?.full_name ?? "Supporter"
      } contributed ₹${t.amount}`,
      time: "Recently",
      icon: Heart,
    })),
  ].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen w-full space-y-8 pb-10 animate-in fade-in">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            {farewellName}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome back, {user?.name?.split(" ")[0] || "Friend"} 👋
          </p>
        </div>

        <Button asChild className="rounded-full font-semibold">
          <Link href={`/dashboard/${farewellId}/contributions`}>
            <Plus className="mr-2 h-4 w-4" /> New Contribution
          </Link>
        </Button>
      </div>

      {/* ---------------- Live Pulse ---------------- */}
      <div className="relative overflow-hidden rounded-full border bg-white/5 backdrop-blur-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max items-center p-2 animate-scroll">
            <span className="flex items-center gap-2 px-3 text-xs font-bold uppercase text-primary">
              <Sparkles className="h-3 w-3" /> Live Pulse
            </span>
            {pulseItems.map((item) => (
              <LiveTickerItem key={item.id} {...item} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* ================= FIXED RESPONSIVE GRID ================= */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          gap-4
          auto-rows-auto
          lg:auto-rows-[minmax(140px,auto)]
        "
      >
        {/* ---------------- Spotlight ---------------- */}
        <div className="col-span-1 sm:col-span-2 lg:row-span-2">
          <GlassCard
            className="relative h-full overflow-hidden"
            contentClassName="p-0 h-full"
          >
            {spotlightItem?.image_url ? (
              <>
                <img
                  src={spotlightItem.image_url}
                  alt="Spotlight"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {spotlightItem.title}
                  </h3>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {spotlightItem.description}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground p-6">
                No highlights yet
              </div>
            )}
          </GlassCard>
        </div>

        {/* ---------------- Stats ---------------- */}
        <div className="min-h-[120px]">
          <StatWidget
            label="Total Collected"
            value={`₹${stats.contributions.toLocaleString()}`}
            icon={Wallet}
            subtext="INR"
          />
        </div>

        <GlassCard className="flex flex-col justify-between min-h-[120px]">
          <Clock className="h-5 w-5 text-blue-400" />
          <div className="flex flex-col">
            {farewellDate ? (
              <span className="text-3xl font-bold">
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(farewellDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}
              </span>
            ) : (
              <span className="text-xl font-bold">TBA</span>
            )}
            <span className="text-xs text-muted-foreground">Days to go</span>
          </div>
          <p className="text-xs text-muted-foreground">Until Farewell</p>
        </GlassCard>

        <StatWidget
          label="Members"
          value={stats.members}
          icon={Users}
          subtext="Joined"
        />

        <StatWidget
          label="Memories"
          value={stats.media}
          icon={ImageIcon}
          subtext="Shared"
        />

        {/* ---------------- Quick Actions ---------------- */}
        <div className="col-span-1 sm:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickAction
              href={`/dashboard/${farewellId}/messages`}
              icon={MessageSquare}
              label="Chat"
              description="Wall"
            />
            <QuickAction
              href={`/dashboard/${farewellId}/memories`}
              icon={ImageIcon}
              label="Gallery"
              description="Photos"
            />
            <QuickAction
              href={`/dashboard/${farewellId}/contributions/history`}
              icon={History}
              label="History"
              description="Txns"
            />
            <QuickAction
              href={`/dashboard/${farewellId}/settings`}
              icon={Settings}
              label="Settings"
              description="Config"
            />
          </div>
        </div>

        {/* ---------------- Recent Activity ---------------- */}
        <div className="col-span-1 sm:col-span-2 lg:row-span-2">
          <GlassCard>
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </h3>

            <div className="space-y-4 sm:max-h-[400px] sm:overflow-y-auto">
              {transactions.length ? (
                transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                  >
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        ₹{t.amount} contributed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ---------------- Announcements ---------------- */}
        <div className="col-span-1 sm:col-span-2 lg:row-span-2">
          <GlassCard>
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <Bell className="h-5 w-5 text-yellow-500" />
              Announcements
            </h3>

            <div className="space-y-4">
              {announcements.length ? (
                announcements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4"
                  >
                    <h4 className="font-semibold">{a.title}</h4>
                    <p className="text-xs text-muted-foreground">{a.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No announcements yet
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
