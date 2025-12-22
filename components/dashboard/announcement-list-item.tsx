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

  // Helper to strip HTML for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Safe strip that works in SSR (though this component is 'use client')
  const previewText =
    typeof document !== "undefined"
      ? stripHtml(announcement.content)
      : announcement.content.replace(/<[^>]*>?/gm, "");

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-2.5 p-3 sm:p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5",
        isSelected ? "bg-primary/5 relative" : "bg-transparent",
        isUnread ? "bg-white/[0.02]" : ""
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}

      {/* 1. Avatar (Left Side) */}
      <div className="shrink-0 pt-1">
        <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
          <AvatarImage src={announcement.creator?.avatar_url || ""} />
          <AvatarFallback className="text-xs font-medium">
            {getInitials(announcement.creator?.full_name || "Admin")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 2. Content Block (Vertical Stack) */}
      <div className="flex-1 min-w-0 grid gap-1.5">
        {/* Top Row: Title + Meta */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-semibold text-sm leading-none truncate pr-2",
              isUnread ? "text-foreground" : "text-foreground/80"
            )}
          >
            {announcement.title}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(announcement.created_at), {
                addSuffix: false,
              })}
            </span>
            <div
              className="text-muted-foreground hover:text-primary cursor-pointer transition-colors"
              onClick={onTogglePin}
            >
              {announcement.is_pinned ? (
                <Pin className="h-3.5 w-3.5 fill-primary text-primary rotate-45" />
              ) : (
                <Star className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Content Snippet */}
        <p
          className={cn(
            "text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words",
            isUnread ? "font-medium text-foreground/70" : ""
          )}
        >
          {previewText}
        </p>

        {/* Optional: Show sender name if needed, or keep minimal */}
        <div className="text-[10px] text-muted-foreground/50 truncate">
          {announcement.creator?.full_name || "System Admin"}
        </div>
      </div>
    </div>
  );
}
