"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getRehearsalByIdAction } from "@/app/actions/rehearsal-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Clock, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { AttendanceGrid } from "@/components/rehearsals/attendance-grid";
import { ParticipantManager } from "@/components/rehearsals/participant-manager";
import { SegmentManager } from "@/components/rehearsals/segment-manager";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export default function RehearsalDetailPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const rehearsalId = params.rehearsalId as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [rehearsal, setRehearsal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Poll for updates (Fast & Simple Realtime)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s for live status
    return () => clearInterval(interval);
  }, [rehearsalId]);

  async function fetchData() {
    // setLoading(true); // Don't block UI on poll
    const result = await getRehearsalByIdAction(rehearsalId);
    if (result && result.rehearsal) {
      setRehearsal(result.rehearsal);
    }
    setLoading(false);
  }

  if (loading && !rehearsal) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-primary/20 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!rehearsal) return <div>Not found</div>;

  // Calculate Stats
  const attendanceRecord = rehearsal.attendance || {};
  const presentCount = Object.values(attendanceRecord).filter(
    (r: any) => r.status === "present"
  ).length;

  // NOTE: For now, we are showing 'participants' if they exist,
  // or falling back to a dummy list if the migration hasn't populated generic users yet.
  // Ideally this list comes from 'performance_performers' or 'farewell_members'
  const participants = rehearsal.participants || [];
  const totalCount = participants.length;
  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/${farewellId}/rehearsals`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {rehearsal.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(rehearsal.start_time), "MMM dd")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(rehearsal.start_time), "HH:mm")} -{" "}
                {format(new Date(rehearsal.end_time), "HH:mm")}
              </span>
              {rehearsal.venue && (
                <span className="uppercase tracking-wider">
                  | {rehearsal.venue}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">Attendance</div>
            <div
              className={
                attendanceRate > 75 ? "text-green-500" : "text-amber-500"
              }
            >
              {attendanceRate}% ({presentCount}/{totalCount})
            </div>
          </div>
          <Badge
            variant={rehearsal.status === "ongoing" ? "default" : "outline"}
          >
            {rehearsal.status === "ongoing" ? "LIVE" : rehearsal.status}
          </Badge>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Attendance & Participants */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Attendance
                </h2>
              </div>

              {/* Reuse Grid but feed it participants from Metadata if available, else generic */}
              <AttendanceGrid
                rehearsalId={rehearsalId}
                farewellId={farewellId}
                participants={rehearsal.metadata?.participants || participants}
                attendance={attendanceRecord}
                isAdmin={isAdmin}
              />
            </section>

            <Separator />

            {/* Participant Manager (Collapsible or in Tab) */}
            <section>
              <ParticipantManager
                rehearsalId={rehearsalId}
                farewellId={farewellId}
                participants={rehearsal.metadata?.participants || []}
                metadata={rehearsal.metadata || {}}
                isAdmin={isAdmin}
                performanceType={rehearsal.performance?.type}
              />
            </section>
          </div>

          {/* Right Col: Run of Show */}
          <div className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Run of Show
                </h2>
              </div>
              <SegmentManager
                rehearsalId={rehearsalId}
                farewellId={farewellId}
                segments={rehearsal.metadata?.segments || []}
                metadata={rehearsal.metadata || {}}
                isAdmin={isAdmin}
                isLive={rehearsal.status === "ongoing"}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
