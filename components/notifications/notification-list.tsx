"use client";

import { useEffect, useState } from "react";
import {
  Notification,
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from "@/app/actions/notifications";
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
  initialNotifications = [],
  onMarkAsRead,
}: NotificationListProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialNotifications.length > 0) {
      setNotifications(initialNotifications);
    } else {
      loadNotifications();
    }
  }, [initialNotifications]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getNotificationsAction();
    setNotifications(data);
    setLoading(false);
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

  if (loading && notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
        <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between p-4 border-b">
        <h4 className="font-semibold">Notifications</h4>
        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            onClick={handleMarkAllAsRead}
            className="text-xs h-7 gap-1"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex gap-3 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer relative group",
                !notification.is_read && "bg-muted/20"
              )}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1 space-y-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-none",
                    !notification.is_read && "font-semibold"
                  )}
                >
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!notification.is_read && (
                <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
