"use client";

import { AlumniMessage } from "@/app/actions/alumni-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";

import { useFarewell } from "@/components/providers/farewell-provider";

interface AlumniMessageCardProps {
  message: AlumniMessage;
}

export function AlumniMessageCard({ message }: AlumniMessageCardProps) {
  const { user } = useFarewell();
  const currentUserId = user?.id;
  return (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="flex flex-row items-start gap-4 pb-2 space-y-0">
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={message.sender?.avatar_url || ""} />
          <AvatarFallback>
            {getInitials(message.sender?.full_name || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">
                {message.sender?.full_name || "Unknown"}
              </p>
              {/* Optional: Add Alumni Badge if we verify roles */}
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium border border-primary/20 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Alumni
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {message.content}
        </p>
      </CardContent>
    </Card>
  );
}
