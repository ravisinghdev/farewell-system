"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  PlayCircle,
  CheckCircle2,
  StopCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { updateRehearsalStatusAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RehearsalHeaderProps {
  rehearsal: any;
  farewellId: string;
  isAdmin: boolean;
}

export function RehearsalHeader({
  rehearsal,
  farewellId,
  isAdmin,
}: RehearsalHeaderProps) {
  const router = useRouter();

  const statusColors: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    scheduled: "secondary",
    ongoing: "default",
    completed: "outline",
    cancelled: "destructive",
  };

  async function handleStatusChange(
    status: "scheduled" | "ongoing" | "completed" | "cancelled"
  ) {
    const result = await updateRehearsalStatusAction(
      rehearsal.id,
      farewellId,
      status
    );
    if (result.error) {
      toast.error("Error updating status", { description: result.error });
    } else {
      toast.success("Status updated", {
        description: `Rehearsal is now ${status}`,
      });
      router.refresh();
    }
  }

  return (
    <div className="bg-background border-b pb-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {rehearsal.title}
            </h1>
            <Badge
              variant={statusColors[rehearsal.status]}
              className="capitalize"
            >
              {rehearsal.status}
            </Badge>
          </div>
          {rehearsal.description && (
            <p className="text-muted-foreground max-w-2xl">
              {rehearsal.description}
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <TooltipProvider>
              {rehearsal.status === "scheduled" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleStatusChange("ongoing")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" /> Start Rehearsal
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Begin the rehearsal session</TooltipContent>
                </Tooltip>
              )}
              {rehearsal.status === "ongoing" && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleStatusChange("completed")}
                        variant="outline"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Finish
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark session as completed</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleStatusChange("scheduled")}
                        variant="outline"
                        size="icon"
                      >
                        <StopCircle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pause or Reset status</TooltipContent>
                  </Tooltip>
                </>
              )}
              {rehearsal.status !== "cancelled" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleStatusChange("cancelled")}
                    >
                      <AlertCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel Rehearsal</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {(() => {
              try {
                const d = new Date(rehearsal.start_time);
                return isNaN(d.getTime())
                  ? ""
                  : format(d, "EEEE, MMMM d, yyyy");
              } catch {
                return "";
              }
            })()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
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
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{rehearsal.venue}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal text-xs">
            {rehearsal.rehearsal_type}
          </Badge>
        </div>
      </div>
    </div>
  );
}
