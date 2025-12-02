"use client";

import { useEffect, useState } from "react";
import {
  Notification,
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from "@/app/actions/notifications";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  CheckCheck,
  Bell,
  MessageSquare,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationListProps {
  initialNotifications?: Notification[];
  onMarkAsRead?: () => void;
}

export function NotificationList({
  initialNotifications,
  onMarkAsRead,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications || []
  );
  const [loading, setLoading] = useState(!initialNotifications);

  useEffect(() => {
    if (initialNotifications) {
      setNotifications(initialNotifications);
      setLoading(false);
    } else {
      loadNotifications();
    }
  }, [initialNotifications]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllAsReadAction();
    if (res.error) {
      toast.error("Failed to mark all as read");
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onMarkAsRead?.();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const res = await markAsReadAction(id);
    if (res.error) {
      toast.error("Failed to mark as read");
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      onMarkAsRead?.();
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "announcement":
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Real-time subscription for the list
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading && notifications.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 space-y-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">No notifications</p>
          <p className="text-xs text-muted-foreground">You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between p-4 border-b bg-muted/5">
        <h4 className="font-semibold text-sm">Notifications</h4>
        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            onClick={handleMarkAllAsRead}
            className="text-xs h-7 gap-1.5 hover:bg-primary/10 hover:text-primary"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex gap-4 p-4 hover:bg-muted/50 transition-all cursor-pointer relative group",
                !notification.is_read ? "bg-primary/5" : "bg-background"
              )}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div
                className={cn(
                  "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  !notification.is_read ? "bg-background shadow-sm" : "bg-muted"
                )}
              >
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm leading-none truncate pr-4",
                      !notification.is_read
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted-foreground"
                    )}
                  >
                    {notification.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>
              </div>
              {!notification.is_read && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
