"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggler";
import { createClient } from "@/utils/supabase/client";

// Components
import { RehearsalHeader } from "@/components/rehearsals/rehearsal-header";
import { RunOfShowExtended } from "@/components/rehearsals/run-of-show-extended";
import { RehearsalAssets } from "@/components/rehearsals/rehearsal-assets";
import { RehearsalCastManager } from "@/components/rehearsals/rehearsal-cast-manager";
import { AttendanceTracker } from "@/components/rehearsals/attendance-tracker";
import { getRehearsalByIdAction } from "@/app/actions/rehearsal-actions";
import { RehearsalOverviewTab } from "@/components/rehearsals/rehearsal-overview-tab";

interface RehearsalDetailClientProps {
  farewellId: string;
  rehearsalId: string;
  initialRehearsal: any; // Ideally typed
  currentUserRole: string | null;
  isAdmin: boolean;
}

export function RehearsalDetailClient({
  farewellId,
  rehearsalId,
  initialRehearsal,
  currentUserRole,
  isAdmin,
}: RehearsalDetailClientProps) {
  const [rehearsal, setRehearsal] = useState<any>(initialRehearsal);

  // Supabase Realtime Subscription
  useEffect(() => {
    // Initial fetch just to be safe or if coming from stale cache
    async function fetchData() {
      const result = await getRehearsalByIdAction(rehearsalId);
      if (result && result.rehearsal) {
        setRehearsal(result.rehearsal);
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`rehearsal-${rehearsalId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rehearsal_sessions",
          filter: `id=eq.${rehearsalId}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rehearsalId]);

  if (!rehearsal)
    return <div className="p-10 text-center">Rehearsal not found</div>;

  const metadata = rehearsal.metadata || {};
  const participants = metadata.participants || [];
  const segments = metadata.segments || [];
  const assets = metadata.assets || [];

  const isLive = rehearsal.status === "ongoing";
  const isCompleted = rehearsal.status === "completed";
  const router = useRouter();

  return (
    <div className="flex flex-col h-full min-h-screen bg-background relative overflow-hidden">
      {/* Sticky Header (Clean/Solid UI) */}
      <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b bg-background/95 backdrop-blur z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground pl-0 gap-2 h-8"
            onClick={() => router.push(`/dashboard/${farewellId}/rehearsals`)}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="h-4 w-px bg-border/40 hidden sm:block" />

          <h1 className="text-sm font-semibold tracking-tight hidden sm:block truncate max-w-[200px] md:max-w-md text-foreground">
            {rehearsal.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
          <Badge
            variant="outline"
            className={cn(
              "uppercase text-[10px] tracking-wider font-bold",
              isLive &&
                "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
              isCompleted &&
                "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
            )}
          >
            {isLive ? "LIVE" : rehearsal.status || "Scheduled"}
          </Badge>
          <div className="h-4 w-px bg-border/40 mx-2" />
          <ThemeToggle />
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 w-full max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* 1. Hero Content (Simplified RehearsalHeader) */}
        <RehearsalHeader
          rehearsal={rehearsal}
          farewellId={farewellId}
          minimal={true}
        />

        {/* 2. Main Content Tabs */}
        <Tabs defaultValue="run-of-show" className="space-y-8">
          <div className="sticky top-[73px] z-10 bg-background/80 backdrop-blur-xl p-1 rounded-full border border-white/10 w-fit shadow-lg shadow-black/5 mx-auto sm:mx-0">
            <TabsList className="bg-transparent h-9 p-0 gap-1">
              <TabsTrigger
                value="run-of-show"
                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
              >
                Run of Show
              </TabsTrigger>
              <TabsTrigger
                value="cast-attendance"
                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
              >
                Cast & Attendance
              </TabsTrigger>
              <TabsTrigger
                value="studio"
                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
              >
                Studio
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
              >
                Overview
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB: Run of Show */}
          <TabsContent
            value="run-of-show"
            className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 mt-0 focus-visible:outline-none"
          >
            <RunOfShowExtended
              rehearsalId={rehearsalId}
              farewellId={farewellId}
              segments={segments}
              rehearsalStartTime={rehearsal.start_time}
              metadata={metadata}
              isAdmin={isAdmin}
            />
          </TabsContent>

          {/* TAB: Cast & Attendance */}
          <TabsContent
            value="cast-attendance"
            className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 mt-0 focus-visible:outline-none"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-2 space-y-6">
                <Card className="p-4 sm:p-6 border-white/5 bg-white/5 backdrop-blur-sm shadow-xl shadow-black/5">
                  <RehearsalCastManager
                    rehearsalId={rehearsalId}
                    farewellId={farewellId}
                    participants={participants}
                    metadata={metadata}
                    isAdmin={isAdmin}
                    currentUserRole={currentUserRole || "Unknown"}
                  />
                </Card>
              </div>
              <div className="space-y-6">
                <AttendanceTracker
                  rehearsalId={rehearsalId}
                  farewellId={farewellId}
                  participants={participants}
                  initialAttendance={rehearsal.attendance}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB: Studio */}
          <TabsContent
            value="studio"
            className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 mt-0 focus-visible:outline-none"
          >
            <RehearsalAssets
              rehearsalId={rehearsalId}
              farewellId={farewellId}
              assets={assets}
              metadata={metadata}
              isAdmin={isAdmin}
            />
          </TabsContent>

          {/* TAB: Overview (Simple Read-only) */}
          <TabsContent
            value="overview"
            className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 mt-0 focus-visible:outline-none"
          >
            <RehearsalOverviewTab
              rehearsal={rehearsal}
              farewellId={farewellId}
              isAdmin={isAdmin}
              participantsCount={participants.length}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
