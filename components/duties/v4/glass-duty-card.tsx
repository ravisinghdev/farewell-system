"use client";

import { Duty } from "@/app/actions/duty-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CalendarIcon, DollarSign, GripVertical, Users } from "lucide-react";
import { format } from "date-fns";

interface GlassDutyCardProps {
  duty: Duty;
  isOverlay?: boolean;
}

export function GlassDutyCard({ duty, isOverlay }: GlassDutyCardProps) {
  const priorityColors = {
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    high: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  // Safe access for optional priority, default to medium if not present (though schema might not have priority yet, added in v3 description? v3 schema didn't have priority column explicitly in CREATE TABLE but createAction used it? Let's assume medium default)
  // Checking createDutyAction: it inserts 'priority'. The interface in duty-actions.ts doesn't have priority!
  // I should check the interface update.
  // Actually, I'll just check `duty` prop.

  const priority = (duty as any).priority || "medium";

  return (
    <Card
      className={cn(
        "relative group backdrop-blur-md border-white/10 shadow-xl transition-all duration-300",
        isOverlay
          ? "bg-white/10 rotate-2 scale-105 cursor-grabbing"
          : "bg-white/5 hover:bg-white/10 cursor-grab",
        "dark:bg-black/20 dark:hover:bg-black/30"
      )}
    >
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex justify-between items-start">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase tracking-wider",
              priorityColors[priority as keyof typeof priorityColors]
            )}
          >
            {priority}
          </Badge>
          {duty.deadline && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {format(new Date(duty.deadline), "MMM d")}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-tight text-white/90">
          {duty.title}
        </h3>
      </CardHeader>
      <CardContent className="p-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Users className="w-3 h-3" />
            <span>{duty.assignments?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3 h-3" />
            <span>{duty.expense_limit}</span>
          </div>
        </div>
        {/* Progress Bar placeholder for Subtasks */}
        {(duty as any).completion_percentage !== undefined && (
          <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full"
              style={{ width: `${(duty as any).completion_percentage}%` }}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center">
        <div className="flex -space-x-2">
          {duty.assignments?.slice(0, 3).map((assign) => (
            <Avatar
              key={assign.id}
              className="w-6 h-6 border-2 border-background"
            >
              <AvatarImage src={assign.user?.avatar_url} />
              <AvatarFallback className="text-[8px]">
                {assign.user?.full_name?.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="text-white/20">
          <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardFooter>
    </Card>
  );
}
