"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RehearsalCardProps {
  rehearsal: any; // Type should be imported from types/custom or supabase generated types
  farewellId: string;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function RehearsalCard({
  rehearsal,
  farewellId,
  isAdmin,
  onDelete,
  onDuplicate,
}: RehearsalCardProps) {
  const statusColors: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    scheduled: "secondary",
    ongoing: "default",
    completed: "outline",
    cancelled: "destructive",
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <div
        className={`absolute top-0 left-0 w-1 h-full ${
          rehearsal.status === "ongoing"
            ? "bg-green-500"
            : rehearsal.status === "cancelled"
            ? "bg-red-500"
            : "bg-primary"
        }`}
      />

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={statusColors[rehearsal.status] || "outline"}
                className="capitalize"
              >
                {rehearsal.status}
              </Badge>
              <Badge
                variant="outline"
                className="capitalize text-xs font-normal"
              >
                {rehearsal.rehearsal_type}
              </Badge>
            </div>
            <CardTitle className="text-lg pt-1 line-clamp-1">
              {rehearsal.title}
            </CardTitle>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/${farewellId}/rehearsals/${rehearsal.id}`}
                  >
                    Manage Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Creating a pseudo-form or handling via a small dialog would be better
                    // But for speed, let's just prompt or use a default 'tomorrow'
                    // Actually, I'll emit an event or rely on a parent handler if passed,
                    // but to be self-contained, I'll use a simple window.prompt for date for now
                    // or better yet, just render a Dialog in this component (might be heavy).
                    // Let's defer to a parent or use a simple confirm for "Duplicate for Tomorrow"?

                    // Simplest MVF (Minimum Viable Feature): Duplicate for Tomorrow
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dateStr = tomorrow.toISOString().split("T")[0];
                    if (
                      confirm(
                        `Duplicate "${rehearsal.title}" for tomorrow (${dateStr})?`
                      )
                    ) {
                      // We need to import the action. But we are client side.
                      // We should pass a handler, but to move fast I'll import.
                      // import { duplicateRehearsalAction } ...
                      // Actually, I'll pass a prop or just Assume the loop above.
                      // To avoid prop drilling hell, let's assume onDuplicate prop.
                      onDuplicate?.(rehearsal.id);
                    }
                  }}
                >
                  Duplicate (Tomorrow)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(rehearsal.id)}
                >
                  Delete Rehearsal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            {(() => {
              try {
                const d = new Date(rehearsal.start_time);
                if (isNaN(d.getTime())) return "";
                return format(d, "EEE, MMM d, yyyy");
              } catch {
                return "";
              }
            })()}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {(() => {
              try {
                const start = new Date(rehearsal.start_time);
                const end = new Date(rehearsal.end_time);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
                return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
              } catch {
                return "";
              }
            })()}
          </span>
        </div>

        {rehearsal.venue && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{rehearsal.venue}</span>
          </div>
        )}

        {rehearsal.description && (
          <p className="text-muted-foreground text-xs line-clamp-2 mt-2 pt-2 border-t">
            {rehearsal.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/dashboard/${farewellId}/rehearsals/${rehearsal.id}`}>
            View Dashboard
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
