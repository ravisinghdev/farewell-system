"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UseRealtimeSubscriptionProps {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
}

export function useRealtimeSubscription({
  table,
  filter,
  event = "*",
  schema = "public",
}: UseRealtimeSubscriptionProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: event as any,
          schema,
          table,
          filter,
        },
        (payload) => {
          console.log("Realtime update:", payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, table, filter, event, schema]);
}
