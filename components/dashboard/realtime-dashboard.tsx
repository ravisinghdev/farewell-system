"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Announcement,
  getAnnouncementsAction,
  DashboardStats,
  getDashboardStatsAction,
  getRecentTransactionsAction,
} from "@/app/actions/dashboard-actions";
import { AnnouncementCard } from "./announcement-card";
import { TransactionsTable } from "./transactions-table";
import {
  Bell,
  Star,
  ImageIcon,
  Wallet,
  MessageCircle,
  Users,
  ArrowRight,
  PiggyBank, // Added
  Activity, // Added
  Plus, // Added
  Clock, // Added
  Settings, // Added
  MessageSquare, // Added
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
import { useFarewell } from "@/components/providers/farewell-provider"; // Added

interface RealtimeDashboardProps {
  initialAnnouncements: Announcement[];
  initialStats: DashboardStats;
  initialTransactions: any[];
  farewellId: string;
  farewellName: string;
  farewellYear: number;
  farewellDate: string | null;
}

export function RealtimeDashboard({
  initialAnnouncements,
  initialStats,
  initialTransactions,
  farewellId,
  farewellName,
  farewellYear,
  farewellDate,
}: RealtimeDashboardProps) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);
  const supabase = createClient();
  const router = useRouter();

  // Sync state with props
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
    setStats(initialStats);
    setTransactions(initialTransactions);
  }, [initialAnnouncements, initialStats, initialTransactions]);

  const refreshData = async () => {
    const [newAnnouncements, newStats, newTransactions] = await Promise.all([
      getAnnouncementsAction(farewellId),
      getDashboardStatsAction(farewellId),
      getRecentTransactionsAction(farewellId),
    ]);
    setAnnouncements(newAnnouncements);
    setStats(newStats);
    setTransactions(newTransactions);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  // Data processing for UI
  const { user } = useFarewell();

  // Combine transactions and announcements for "Live Activity"
  const recentActivity = [
    ...announcements.slice(0, 3).map((a) => ({
      id: `ann-${a.id}`,
      user: "Admin", // Announcements usually from admin
      action: "announcement",
      message: a.title,
      time: new Date(a.created_at).toLocaleDateString(), // Simplification
      icon: Bell,
      avatar: null,
      amount: undefined, // Explicitly undefined for TS
    })),
    ...transactions.slice(0, 5).map((t) => ({
      id: `tx-${t.id}`,
      user: t.user_name || "Anonymous",
      action: "contributed",
      amount: `₹${t.amount}`,
      time: new Date(t.created_at).toLocaleDateString(),
      avatar: t.user_avatar,
      message: undefined, // Explicitly undefined for TS
      icon: Wallet, // Fixed: use Wallet icon instead of undefined to prevent crash
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.time as string).getTime() -
        new Date(a.time as string).getTime()
    )
    .slice(0, 10);

  const statsList = [
    {
      title: "Total Contributions",
      value: `₹${stats.contributions.toLocaleString()}`,
      change: "Total collected",
      icon: PiggyBank,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Days Remaining",
      value: farewellDate
        ? Math.ceil(
            (new Date(farewellDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ) + " Days"
        : "TBA",
      change: "Until Event",
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Memories Shared",
      value: stats.media.toString(),
      change: "Photos & Videos",
      icon: ImageIcon,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "Batch Members",
      value: stats.members.toString(),
      change: "Joined",
      icon: Users,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-8 sm:p-10 shadow-xl">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-2">
              <span className="text-transparent bg-clip-text">
                Hello, {user?.name?.split(" ")[0] || "Student"}
              </span>
              <span className="text-foreground">👋</span>
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Welcome to the{" "}
              <span className="text-foreground font-medium">
                {farewellName}
              </span>{" "}
              dashboard.
              {farewellDate
                ? " The big event is approaching fast!"
                : " Setting up for the big goodbye!"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              className="rounded-xl h-10 px-6 font-semibold shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
            >
              <Link href={`/dashboard/${farewellId}/contributions`}>
                <Plus className="mr-2 h-4 w-4" /> Contribute
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl h-10 px-6 border-primary/20 bg-primary/5 hover:bg-primary/10"
            >
              <Link href={`/dashboard/${farewellId}/farewell-event`}>
                View Event Details
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300 relative group overflow-hidden`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/10 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full bg-white/10 ${stat.color}`}
              >
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {stat.title}
              </p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
            {/* Glow Effect */}
            <div
              className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity ${stat.bg.replace(
                "/10",
                "/30"
              )}`}
            />
          </div>
        ))}
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Activity
            </h3>
            {/* Simplified view logic for now */}
          </div>
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="relative mt-1">
                    <div className="h-full w-px bg-border/50 absolute left-4 top-4 -z-10 group-last:hidden" />
                    <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 z-10 relative overflow-hidden">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt="avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        // @ts-ignore
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          <span className="text-foreground">{item.user}</span>
                          <span className="text-muted-foreground mx-1">
                            {item.action === "contributed" && "contributed"}
                            {item.action === "announcement" &&
                              "posted an announcement"}
                            {item.action === "uploaded" &&
                              "uploaded new memories"}
                          </span>
                          {item.amount && (
                            <span className="font-bold text-emerald-500">
                              {item.amount}
                            </span>
                          )}
                        </p>
                        {item.message && (
                          <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded-lg inline-block">
                            "{item.message}"
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions & Progress */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="rounded-3xl border border-white/10 bg-card p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/dashboard/${farewellId}/chat`}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-accent/30 hover:bg-accent hover:scale-[1.02] transition-all"
              >
                <MessageSquare className="h-6 w-6 mb-2 text-blue-500" />
                <span className="text-xs font-medium">Chat</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/memories`}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-accent/30 hover:bg-accent hover:scale-[1.02] transition-all"
              >
                <ImageIcon className="h-6 w-6 mb-2 text-purple-500" />
                <span className="text-xs font-medium">Gallery</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/contributions/history`}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-accent/30 hover:bg-accent hover:scale-[1.02] transition-all"
              >
                <Wallet className="h-6 w-6 mb-2 text-emerald-500" />
                <span className="text-xs font-medium">History</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/settings`}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-accent/30 hover:bg-accent hover:scale-[1.02] transition-all"
              >
                <Settings className="h-6 w-6 mb-2 text-zinc-500" />
                <span className="text-xs font-medium">Settings</span>
              </Link>
            </div>
          </div>

          {/* Countdown Widget */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-card to-background p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" /> Countdown
              </h3>
            </div>
            {farewellDate ? (
              <div className="py-2">
                <Countdown targetDate={farewellDate} />
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground py-4">
                Date TBA
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
