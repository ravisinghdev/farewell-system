"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  MessageCircle,
  Image as ImageIcon,
  Users,
  Bell,
  ArrowRight,
  Star,
  Clock,
} from "lucide-react";

// Mock Data matching RealtimeDashboard structure
const MOCK_STATS = {
  contributions: "₹45,250",
  messages: "128",
  media: "342",
  members: "56",
};

const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Venue Finalized: Grand Hall",
    content:
      "We are excited to announce that the farewell will be held at the Grand Hall. Dress code is formal.",
    time: "2h ago",
    author: "Admin",
  },
  {
    id: 2,
    title: "Contribution Deadline Extended",
    content:
      "Please submit your contributions by this Friday to ensure we can book the catering.",
    time: "1d ago",
    author: "Treasurer",
  },
];

export default function ScreensCarousel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden text-foreground">
      {/* Browser Chrome - Hidden on mobile */}
      <div className="hidden md:flex h-10 bg-muted/50 border-b border-border items-center px-4 gap-4 flex-shrink-0">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground flex items-center gap-2 w-64 justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            farewell.app/dashboard
          </div>
        </div>
      </div>

      {/* App Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Collapsed on mobile) */}
        <div className="w-16 md:w-64 border-r border-border bg-card/30 hidden md:flex flex-col p-4 gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/20 mb-6" />
          {["Home", "Timeline", "Contributions", "Gallery", "Members"].map(
            (item, i) => (
              <div
                key={item}
                className={`h-9 rounded-md w-full flex items-center px-3 text-sm font-medium ${
                  i === 0
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
          {/* Header */}
          <div className="h-14 md:h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm flex-shrink-0">
            <div className="font-semibold text-base md:text-lg">Dashboard</div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-accent flex items-center justify-center">
                <Bell className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-primary to-purple-600" />
            </div>
          </div>

          {/* Scrollable Content - Matching RealtimeDashboard layout */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scrollbar-hide">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 md:p-12 text-primary-foreground shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left max-w-2xl">
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                    Class of 2025
                  </h1>
                  <p className="text-lg text-primary-foreground/80 font-medium">
                    Farewell 2025 • Celebrating our journey together
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                    <div className="h-10 px-6 rounded-full bg-white text-primary font-medium flex items-center gap-2 shadow-lg cursor-default">
                      View Timeline <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="h-10 px-6 rounded-full border border-white/30 text-white font-medium flex items-center hover:bg-white/10 cursor-default">
                      Contribute Now
                    </div>
                  </div>
                </div>

                {/* Countdown Card Preview */}
                <div className="w-full max-w-xs bg-black/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/70 text-center mb-4">
                    Countdown
                  </p>
                  <div className="flex justify-between text-center">
                    {[
                      { val: "15", label: "Days" },
                      { val: "08", label: "Hrs" },
                      { val: "45", label: "Mins" },
                    ].map((t) => (
                      <div key={t.label}>
                        <div className="text-2xl font-bold text-white">
                          {t.val}
                        </div>
                        <div className="text-[10px] text-white/60">
                          {t.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Contributions",
                  value: MOCK_STATS.contributions,
                  icon: Wallet,
                  sub: "Total collected",
                },
                {
                  label: "Messages",
                  value: MOCK_STATS.messages,
                  icon: MessageCircle,
                  sub: "Total messages",
                },
                {
                  label: "Gallery",
                  value: MOCK_STATS.media,
                  icon: ImageIcon,
                  sub: "Photos uploaded",
                },
                {
                  label: "Members",
                  value: MOCK_STATS.members,
                  icon: Users,
                  sub: "Joined so far",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl bg-card border border-border shadow-sm"
                >
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </div>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Recent Announcements */}
              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Latest Announcements
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    View All
                  </span>
                </div>

                <div className="grid gap-4">
                  {MOCK_ANNOUNCEMENTS.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-6 rounded-xl bg-card border border-border shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{ann.title}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {ann.time}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">
                        {ann.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {ann.author[0]}
                        </div>
                        <span>Posted by {ann.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Highlights
                  </h2>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-card to-muted/50 border border-border shadow-sm p-6">
                  <h3 className="font-semibold mb-1">Don't Miss Out!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check out the latest updates and featured content.
                  </p>
                  <div className="rounded-lg bg-muted aspect-video flex items-center justify-center text-muted-foreground mb-4">
                    <ImageIcon className="h-10 w-10 opacity-20" />
                  </div>
                  <div className="w-full py-2 rounded-md bg-primary text-primary-foreground text-center text-sm font-medium">
                    Explore Highlights
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
