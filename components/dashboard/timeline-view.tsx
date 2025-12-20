"use client";

import {
  TimelineEvent,
  deleteTimelineEventAction,
} from "@/app/actions/dashboard-actions";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isSameDay } from "date-fns";
import {
  Calendar,
  Music,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  FlaskConical,
  Utensils,
  Camera,
  Mic2,
  MoreVertical,
  Pencil,
  Trash2,
  CalendarIcon,
  PartyPopper,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimelineEventDialog } from "./timeline-event-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimelineViewProps {
  events: TimelineEvent[];
  farewellId: string;
  isAdmin: boolean;
}

export function TimelineView({
  events,
  farewellId,
  isAdmin,
}: TimelineViewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        return PartyPopper;
      case "food":
        return Utensils;
      case "camera":
        return Camera;
      case "mic":
        return Mic2;
      default:
        return CalendarIcon;
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    startTransition(async () => {
      const result = await deleteTimelineEventAction(deletingId, farewellId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Event deleted successfully");
        setDeletingId(null);
      }
    });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = format(new Date(event.event_date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="relative space-y-8 sm:space-y-12 pl-4 sm:pl-0 pb-20">
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              timeline event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vertical Spine Line */}
      <div className="absolute left-8 sm:left-32 top-2 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden sm:block" />
      {/* Mobile Spine */}
      <div className="absolute left-6 top-2 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent block sm:hidden" />

      {sortedDates.map((dateKey, dateIndex) => {
        const dayEvents = groupedEvents[dateKey];
        const date = new Date(dateKey);
        const isTodayDate = isToday(date);

        return (
          <div key={dateKey} className="relative">
            {/* Day Header for Mobile/Desktop */}
            <div className="flex sm:hidden items-center gap-3 mb-6 ml-12">
              <div
                className={cn(
                  "text-lg font-bold",
                  isTodayDate ? "text-primary" : "text-foreground"
                )}
              >
                {format(date, "EEEE, MMMM d")}
              </div>
              {isTodayDate && (
                <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                  TODAY
                </Badge>
              )}
            </div>

            {dayEvents.map((event, index) => {
              const Icon = getIcon(event.icon);
              const eventDate = new Date(event.event_date);
              const isEventPast = isPast(eventDate) && !isToday(eventDate);
              const isEventToday = isToday(eventDate);

              // Only show date on the first event of the day for desktop
              const showDate = index === 0;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "relative flex flex-col sm:flex-row items-start group animation-delay mb-8 sm:mb-12 last:mb-0",
                    isEventPast ? "opacity-70 grayscale-[0.5]" : "opacity-100"
                  )}
                  style={{
                    animationDelay: `${
                      (dateIndex * dayEvents.length + index) * 50
                    }ms`,
                  }}
                >
                  {/* 1. Date Column (Desktop) */}
                  <div className="hidden sm:flex flex-col items-end w-24 pr-8 text-right shrink-0 min-h-[50px]">
                    {showDate && (
                      <>
                        <span
                          className={cn(
                            "text-2xl font-bold leading-none tracking-tight",
                            isTodayDate ? "text-primary" : "text-foreground"
                          )}
                        >
                          {format(date, "d")}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-1">
                          {format(date, "MMM")}
                        </span>
                        {isTodayDate && (
                          <Badge
                            variant="outline"
                            className="mt-2 text-[10px] px-1 py-0 border-primary/30 text-primary"
                          >
                            TODAY
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  {/* 2. Timeline Node */}
                  <div className="absolute left-6 sm:left-32 -translate-x-1/2 flex items-center justify-center z-10 pt-1">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125 bg-background",
                        isEventToday
                          ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                          : "border-muted-foreground/30 group-hover:border-primary"
                      )}
                    >
                      {isEventToday && (
                        <div className="w-full h-full rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* 3. Card Content */}
                  <div className="ml-12 sm:ml-8 w-full sm:max-w-xl lg:max-w-2xl">
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 border backdrop-blur-md group-hover:-translate-y-1 group-hover:shadow-lg",
                        isEventToday
                          ? "bg-primary/5 border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]"
                          : "bg-card/40 border-primary/10 hover:bg-card/60 hover:border-primary/20"
                      )}
                    >
                      {/* Glossy Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-1.5 h-5 font-mono"
                              >
                                {format(eventDate, "h:mm a")}
                              </Badge>
                              {event.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">
                                    {event.location}
                                  </span>
                                </div>
                              )}
                            </div>
                            <h3
                              className={cn(
                                "text-lg font-bold tracking-tight",
                                isEventToday
                                  ? "text-primary"
                                  : "text-foreground"
                              )}
                            >
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="text-muted-foreground text-sm leading-relaxed max-w-md pt-1">
                                {event.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div
                              className={cn(
                                "p-2.5 rounded-xl shrink-0 transition-colors",
                                isEventToday
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted/30 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>

                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <TimelineEventDialog
                                    farewellId={farewellId}
                                    event={event}
                                    trigger={
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="cursor-pointer"
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                    }
                                  />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                    onClick={() => setDeletingId(event.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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
      })}
    </div>
  );
}
