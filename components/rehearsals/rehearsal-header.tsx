"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface RehearsalHeaderProps {
  rehearsal: any;
  farewellId: string;
  className?: string;
}

export function RehearsalHeader({
  rehearsal,
  farewellId,
  className,
  minimal = false,
}: RehearsalHeaderProps & { minimal?: boolean }) {
  const router = useRouter();
  const isLive = rehearsal.status === "ongoing";
  const isCompleted = rehearsal.status === "completed";

  const startTime = new Date(rehearsal.start_time);
  const endTime = new Date(rehearsal.end_time);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation & Status Line - HIDDEN in minimal mode */}
      {!minimal && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground pl-0 gap-2"
            onClick={() => router.push(`/dashboard/${farewellId}/rehearsals`)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedule
          </Button>

          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            <Badge
              variant={
                isLive ? "destructive" : isCompleted ? "secondary" : "default"
              }
              className={
                isLive ? "bg-red-500 hover:bg-red-600 border-none" : ""
              }
            >
              {isLive
                ? "LIVE NOW"
                : (rehearsal.status || "scheduled").toUpperCase()}
            </Badge>
          </div>
        </div>
      )}

      {/* Hero Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
        <div className="space-y-2 min-w-0 max-w-full">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground truncate max-w-[90vw] md:max-w-2xl">
            {rehearsal.title}
          </h1>
          {rehearsal.performance && (
            <div className="flex items-center gap-2 text-lg text-muted-foreground font-medium">
              <span>Performance:</span>
              <Badge
                variant="outline"
                className="text-base px-3 py-1 truncate max-w-[200px] md:max-w-sm block"
              >
                {rehearsal.performance.title}
              </Badge>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm md:text-base text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{format(startTime, "EEEE, MMMM do, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              <span>
                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
              </span>
            </div>
            {rehearsal.venue && (
              <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4" />
                <span>{rehearsal.venue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Widget (Countdown or Duration) */}
        {!isLive && !isCompleted && !isPast(startTime) && (
          <div className="bg-card border shadow-sm rounded-xl p-4 min-w-[200px] text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Starts In
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {formatDistanceToNow(startTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
