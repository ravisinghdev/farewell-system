"use client";

import { Performance, RiskLevel } from "@/types/performance";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mic2,
  Users,
  MoreVertical,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PerformanceCardProps {
  performance: Performance;
  isAdmin: boolean;
  onEdit: (p: Performance) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string, current: boolean) => void;
}

export function PerformanceCard({
  performance,
  isAdmin,
  onEdit,
  onDelete,
  onToggleLock,
}: PerformanceCardProps) {
  // Helpers for UI logic
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md border-l-4",
        performance.risk_level === "high"
          ? "border-l-red-500"
          : performance.risk_level === "medium"
          ? "border-l-amber-500"
          : "border-l-green-500"
      )}
    >
      {/* Background status pattern (optional decoration) */}
      {performance.is_locked && (
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Lock className="w-12 h-12" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-none">
                {performance.title}
              </h3>
              {performance.is_locked && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="capitalize">
                {performance.type.replace("_", " ")}
              </Badge>
              <span className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {formatDuration(performance.duration_seconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "capitalize border",
                getRiskColor(performance.risk_level)
              )}
            >
              {performance.risk_level} Risk
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(performance)}>
                  Edit Details
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        onToggleLock(performance.id, performance.is_locked)
                      }
                    >
                      {performance.is_locked
                        ? "Unlock Performance"
                        : "Lock Details"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(performance.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        {/* Health Score Section */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="w-3 h-3" />
              Stage Readiness
            </span>
            <span
              className={cn(
                performance.health_score >= 80
                  ? "text-green-600"
                  : performance.health_score >= 50
                  ? "text-amber-600"
                  : "text-red-600"
              )}
            >
              {performance.health_score}%
            </span>
          </div>
          <Progress
            value={performance.health_score}
            indicatorClassName={getHealthColor(performance.health_score)}
            className="h-2"
          />
        </div>

        {/* Coordinators */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              Lead
            </span>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-full pr-3 pl-1 py-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={performance.lead_coordinator?.avatar_url} />
                <AvatarFallback className="text-[10px]">LC</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium truncate max-w-[100px]">
                {performance.lead_coordinator?.full_name || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Requirements Icons */}
          <div className="flex gap-2 text-muted-foreground">
            {performance.stage_requirements?.mics && (
              <div
                className="flex items-center gap-0.5"
                title={`${performance.stage_requirements.mics} Mics`}
              >
                <Mic2 className="w-3 h-3" />
                <span className="text-xs">
                  {performance.stage_requirements.mics}
                </span>
              </div>
            )}
            {performance.performers && performance.performers.length > 0 && (
              <div
                className="flex items-center gap-0.5"
                title={`${performance.performers.length} Performers`}
              >
                <Users className="w-3 h-3" />
                <span className="text-xs">{performance.performers.length}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              performance.status === "ready"
                ? "bg-green-500"
                : performance.status === "rehearsing"
                ? "bg-blue-500"
                : performance.status === "locked"
                ? "bg-purple-500"
                : "bg-slate-300"
            )}
          />
          <span className="capitalize">{performance.status}</span>
        </div>
        {performance.is_locked ? (
          <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-medium border border-purple-100">
            <Lock className="w-2 h-2" /> Locked
          </span>
        ) : (
          <span className="text-[10px]">Last edit: Today</span>
        )}
      </CardFooter>
    </Card>
  );
}
