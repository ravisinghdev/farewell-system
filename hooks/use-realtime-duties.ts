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
        },
        () => {
          onUpdate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_receipts",
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
