"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useRealtimeDuties(farewellId: string, onUpdate: () => void) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!farewellId) return;

    const channel = supabase
      .channel(`duties-realtime-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duties",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          onUpdate();
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_assignments",
          // We can't filter by farewell_id directly on assignments easily without join,
          // but we can just listen to all assignments and filter or just refresh.
          // For scalability, maybe we rely on the fact that RLS filters what we receive?
          // Actually, RLS applies to subscriptions too.
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, onUpdate, router, supabase]);
}
