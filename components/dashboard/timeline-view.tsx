"use client";

import { TimelineEvent } from "@/app/actions/dashboard-actions";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  Music,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineViewProps {
  events: TimelineEvent[];
}

export function TimelineView({ events }: TimelineViewProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "music":
        return Music;
      case "star":
        return Star;
      case "clock":
        return Clock;
      case "map":
        return MapPin;
      case "party":
        return FlaskConical;
      default:
        return Calendar;
    }
  };

  return (
    <div className="relative space-y-12 sm:space-y-16 pl-4 sm:pl-0">
      {/* Vertical Spine Line */}
      <div className="absolute left-8 sm:left-32 top-2 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden sm:block" />
      {/* Mobile Spine */}
      <div className="absolute left-6 top-2 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent block sm:hidden" />

      {events.map((event, index) => {
        const Icon = getIcon(event.icon);
        const eventDate = new Date(event.event_date);
        const isEventPast = isPast(eventDate) && !isToday(eventDate);
        const isEventToday = isToday(eventDate);

        return (
          <div
            key={event.id}
            className={cn(
              "relative flex flex-col sm:flex-row items-start group animation-delay",
              isEventPast ? "opacity-70 grayscale-[0.5]" : "opacity-100"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* 1. Date Column (Desktop) */}
            <div className="hidden sm:flex flex-col items-end w-24 pr-8 text-right shrink-0">
              <span
                className={cn(
                  "text-2xl font-bold leading-none tracking-tight",
                  isEventToday ? "text-primary" : "text-foreground"
                )}
              >
                {format(eventDate, "d")}
              </span>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-1">
                {format(eventDate, "MMM")}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {format(eventDate, "yyyy")}
              </span>
            </div>

            {/* 2. Timeline Node */}
            <div className="absolute left-6 sm:left-32 -translate-x-1/2 flex items-center justify-center z-10">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125",
                  isEventToday
                    ? "bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                    : "bg-background border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary"
                )}
              >
                {isEventPast && (
                  <CheckCircle2 className="w-full h-full text-background p-0.5" />
                )}
              </div>
            </div>

            {/* 3. Card Content */}
            <div className="ml-12 sm:ml-8 w-full sm:w-[500px] lg:w-[600px]">
              {/* Mobile Date Header */}
              <div className="sm:hidden flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 text-primary bg-primary/5"
                >
                  {format(eventDate, "MMM d, yyyy")}
                </Badge>
                {isEventToday && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                    TODAY
                  </Badge>
                )}
              </div>

              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 border backdrop-blur-md group-hover:-translate-y-1 group-hover:shadow-lg",
                  isEventToday
                    ? "bg-primary/5 border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3
                        className={cn(
                          "text-xl font-bold mb-2 tracking-tight",
                          isEventToday ? "text-primary" : "text-foreground"
                        )}
                      >
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-xl shrink-0",
                        isEventToday
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/10 text-muted-foreground"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary/70" />
                      {format(eventDate, "h:mm a")}
                    </div>
                    {/* Placeholder for location if added to DB scheme later */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500/70" />
                      Venue TBD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
