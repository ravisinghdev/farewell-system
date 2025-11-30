"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

interface AdminNotificationsProps {
  userId: string;
  role: string;
}

export function AdminNotifications({ userId, role }: AdminNotificationsProps) {
  const supabase = createClient();

  useEffect(() => {
    // Only listen if the user is an admin
    if (
      role !== "admin" &&
      role !== "main_admin" &&
      role !== "parallel_admin"
    ) {
      return;
    }

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_messages",
        },
        (payload) => {
          console.log("New contact message:", payload);
          toast("New Contact Message", {
            description: `${payload.new.name}: ${payload.new.subject}`,
            icon: <Mail className="w-4 h-4" />,
            action: {
              label: "View",
              onClick: () => console.log("Navigate to admin messages"), // Placeholder for navigation
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, supabase]);

  return null;
}
