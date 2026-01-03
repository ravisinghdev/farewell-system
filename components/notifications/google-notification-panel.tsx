"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Bell, X, Inbox } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
  Notification,
} from "@/app/actions/notifications";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface GoogleNotificationPanelProps {
  onMarkAsRead?: () => void;
  onNotificationsChanged?: () => void;
  userId?: string;
}

export function GoogleNotificationPanel({
  onMarkAsRead,
  onNotificationsChanged,
  userId,
}: GoogleNotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [supabase] = useState(() => createClient());

  // 1. Fetch Initial Data
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 2. Realtime Subscription
    const channel = supabase
      .channel("active_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          // Add new notification to top
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          toast("New Notification", {
            description: newNotification.title,
            action: {
              label: "View",
              onClick: () => setActiveTab("unread"),
            },
          });
          onNotificationsChanged?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadAction();
      toast.success("All notifications marked as read");
      fetchNotifications();
      onMarkAsRead?.();
      onNotificationsChanged?.();
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsReadAction(id);
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      onMarkAsRead?.();
      onNotificationsChanged?.();
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };

  return (
    <div className="w-[360px] md:w-[400px] flex flex-col h-[500px] max-h-[90vh] bg-background rounded-xl overflow-hidden shadow-2xl border border-border/50 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="text-lg font-medium text-foreground">Notifications</h3>
        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs h-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 pt-2 pb-0 gap-4 border-b border-border/40 shrink-0 bg-background">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "pb-2 text-sm font-medium transition-all relative",
            activeTab === "all"
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={cn(
            "pb-2 text-sm font-medium transition-all relative flex items-center gap-1.5",
            activeTab === "unread"
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Unread
          {notifications.filter((n) => !n.is_read).length > 0 && (
            <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              {notifications.filter((n) => !n.is_read).length}
            </span>
          )}
          {activeTab === "unread" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-muted/5">
        <ScrollArea className="h-full">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pt-20 px-6 text-center text-muted-foreground">
              <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-10 w-10 opacity-20" />
              </div>
              <p className="text-sm font-medium text-foreground">
                You're all caught up!
              </p>
              <p className="text-xs mt-1 opacity-70">
                No new notifications to see here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col py-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() =>
                    !notification.is_read && handleMarkRead(notification.id)
                  }
                  className={cn(
                    "group flex gap-4 px-4 py-3 cursor-pointer transition-colors relative",
                    notification.is_read
                      ? "bg-transparent hover:bg-muted/50"
                      : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  )}
                >
                  <div className="shrink-0 mt-1">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage src="" />
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold",
                          notification.type === "error" ||
                            notification.type === "warning"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : notification.type === "success"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        )}
                      >
                        {notification.type === "error" ||
                        notification.type === "warning" ? (
                          "!"
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notification.is_read
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground/90"
                        )}
                      >
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    {/* HTML Content Rendering */}
                    <div
                      className="text-xs text-muted-foreground line-clamp-2 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: notification.message }}
                    />
                  </div>
                  {!notification.is_read && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 shadow-sm" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
