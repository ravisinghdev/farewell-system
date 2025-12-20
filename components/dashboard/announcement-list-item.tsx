"use client";

import { Announcement } from "@/app/actions/dashboard-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Star, Pin } from "lucide-react";
import { MouseEvent } from "react";

interface AnnouncementListItemProps {
  announcement: Announcement;
  isSelected?: boolean;
  onSelect: () => void;
  isUnread?: boolean; // For future use
  onTogglePin?: (e: MouseEvent) => void;
}

export function AnnouncementListItem({
  announcement,
  isSelected,
  onSelect,
  onTogglePin,
}: AnnouncementListItemProps) {
  const isUnread = !announcement.is_read;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 p-3 px-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5",
        isSelected && "bg-primary/5 border-l-2 border-l-primary",
        isUnread ? "font-semibold bg-white/[0.02]" : "text-muted-foreground"
      )}
    >
      {/* 1. Selection/Pin (Mimic Gmail's star) */}
      <div
        className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-full hover:bg-white/10"
        onClick={onTogglePin}
      >
        {announcement.is_pinned ? (
          <Pin className="h-4 w-4 fill-primary text-primary rotate-45" />
        ) : (
          <Star className="h-4 w-4 group-hover:block hidden" />
        )}
        {!announcement.is_pinned && (
          <div className="h-4 w-4 group-hover:hidden" />
        )}
        {/* Placeholder to keep alignment if not pinned and not hovering */}
      </div>

      {/* 2. Avatar */}
      <div className="shrink-0">
        <Avatar className="h-8 w-8 border border-white/10">
          <AvatarImage src={announcement.creator?.avatar_url || ""} />
          <AvatarFallback className="text-[10px]">
            {getInitials(announcement.creator?.full_name || "Admin")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 3. Content Block (Flex grow) */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
        {/* Sender Name */}
        <span
          className={cn(
            "text-sm truncate sm:w-32 lg:w-40 shrink-0",
            isUnread || isSelected
              ? "text-foreground font-medium"
              : "text-foreground/80"
          )}
        >
          {announcement.creator?.full_name || "System Admin"}
        </span>

        {/* Subject & Snippet */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden text-sm">
          <span
            className={cn(
              "truncate",
              isUnread || isSelected ? "text-foreground font-medium" : ""
            )}
          >
            {announcement.title}
          </span>
          <span className="text-muted-foreground hidden sm:inline">-</span>
          <span className="text-muted-foreground truncate opacity-70">
            {announcement.content}
          </span>
        </div>
      </div>

      {/* 4. Timestamp */}
      <div className="shrink-0 text-xs font-medium whitespace-nowrap text-muted-foreground/60 w-16 text-right">
        {formatDistanceToNow(new Date(announcement.created_at), {
          addSuffix: false,
        })}
      </div>
    </div>
  );
}
