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
import { Calendar, Clock, MapPin, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RehearsalCardProps {
  rehearsal: any;
  farewellId: string;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
}

export function RehearsalCard({
  rehearsal,
  farewellId,
  isAdmin,
  onDelete,
}: RehearsalCardProps) {
  const statusStyles: Record<string, string> = {
    scheduled: "from-indigo-500 to-blue-500",
    ongoing: "from-emerald-500 to-green-500",
    completed: "from-slate-400 to-slate-500",
    cancelled: "from-rose-500 to-red-500",
  };

  const statusBadge: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    scheduled: "secondary",
    ongoing: "default",
    completed: "outline",
    cancelled: "destructive",
  };

  return (
    <Card className="relative overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
      {/* Gradient status strip */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
          statusStyles[rehearsal.status] ?? "from-primary to-primary"
        }`}
      />

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={statusBadge[rehearsal.status] ?? "outline"}
                className="capitalize px-2 py-0.5 text-xs"
              >
                {rehearsal.status}
              </Badge>

              {rehearsal.rehearsal_type && (
                <Badge
                  variant="outline"
                  className="capitalize text-[11px] font-normal text-muted-foreground"
                >
                  {rehearsal.rehearsal_type}
                </Badge>
              )}
            </div>

            <CardTitle className="text-lg font-semibold leading-snug line-clamp-1">
              {rehearsal.title}
            </CardTitle>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="rounded-lg border shadow-md"
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`/dashboard/${farewellId}/rehearsals/${rehearsal.id}`}
                  >
                    Manage Details
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                  onClick={() => onDelete?.(rehearsal.id)}
                >
                  Delete Rehearsal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {(() => {
              try {
                const d = new Date(rehearsal.start_time);
                return isNaN(d.getTime()) ? "" : format(d, "EEE, MMM d, yyyy");
              } catch {
                return "";
              }
            })()}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {(() => {
              try {
                const start = new Date(rehearsal.start_time);
                const end = new Date(rehearsal.end_time);
                return isNaN(start.getTime()) || isNaN(end.getTime())
                  ? ""
                  : `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
              } catch {
                return "";
              }
            })()}
          </span>
        </div>

        {/* Venue */}
        {rehearsal.venue && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{rehearsal.venue}</span>
          </div>
        )}

        {/* Description */}
        {rehearsal.description && (
          <p className="pt-2 mt-2 text-xs text-muted-foreground border-t line-clamp-2">
            {rehearsal.description}
          </p>
        )}

        {/* Goal */}
        {rehearsal.goal && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span className="mr-1 font-semibold uppercase tracking-wide text-muted-foreground">
              Goal:
            </span>
            {rehearsal.goal}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full rounded-lg font-medium shadow-sm">
          <Link href={`/dashboard/${farewellId}/rehearsals/${rehearsal.id}`}>
            Open Rehearsal Dashboard →
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
