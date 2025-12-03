"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function useRealtimeDutyDetails(dutyId: string, onUpdate: () => void) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!dutyId) return;

    const channel = supabase
      .channel(`duty-details-${dutyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duties",
          filter: `id=eq.${dutyId}`,
        },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_updates",
          filter: `duty_id=eq.${dutyId}`,
        },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_receipts",
          filter: `duty_id=eq.${dutyId}`,
        },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_assignments",
          filter: `duty_id=eq.${dutyId}`,
        },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "receipt_votes",
          filter: `duty_id=eq.${dutyId}`,
        },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dutyId, onUpdate, supabase]);
}
