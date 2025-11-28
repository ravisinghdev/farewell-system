"use client";

import { Announcement } from "@/app/actions/dashboard-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { Pin } from "lucide-react";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary/50">
      {announcement.is_pinned && (
        <div className="absolute top-0 right-0 p-2">
          <Pin className="h-4 w-4 text-primary rotate-45" fill="currentColor" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={announcement.creator?.avatar_url || ""} />
            <AvatarFallback>
              {getInitials(announcement.creator?.full_name || "Admin")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold leading-none tracking-tight">
              {announcement.title}
            </h3>
            <span className="text-xs text-muted-foreground mt-1">
              {format(
                new Date(announcement.created_at),
                "MMM d, yyyy • h:mm a"
              )}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}
