"use client";

import { TimelineEvent } from "@/app/actions/dashboard-actions";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, Music, Star, Clock, MapPin } from "lucide-react";

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
      default:
        return Calendar;
    }
  };

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {events.map((event, index) => {
        const Icon = getIcon(event.icon);
        const isEven = index % 2 === 0;

        return (
          <div
            key={event.id}
            className={cn(
              "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group",
              isEven ? "md:flex-row" : ""
            )}
          >
            {/* Icon */}
            <div className="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border shadow-sm z-10 group-hover:scale-110 transition-transform duration-300 group-hover:border-primary">
              <Icon className="w-5 h-5 transition-colors" />
            </div>

            {/* Content */}
            <div
              className={cn(
                "ml-16 md:ml-0 w-full md:w-[calc(50%-2.5rem)]",
                isEven ? "md:mr-auto" : "md:ml-auto"
              )}
            >
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full">
                      {format(new Date(event.event_date), "MMM d, yyyy")}
                    </span>
                    <span className="text-xs">
                      {format(new Date(event.event_date), "h:mm a")}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm">{event.description}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}
