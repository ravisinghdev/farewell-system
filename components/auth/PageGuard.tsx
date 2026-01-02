"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { PageSetting } from "@/types/page-settings";
import { Lock, Construction, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageGuardProps {
  farewellId: string;
  pageKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode; // Optional custom fallback
  bypass?: boolean;
}

export function PageGuard({
  farewellId,
  pageKey,
  children,
  fallback,
  bypass,
}: PageGuardProps) {
  const [enabled, setEnabled] = useState(true);
  const [setting, setSetting] = useState<PageSetting | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // 1. Initial Fetch
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("farewells")
        .select("page_settings")
        .eq("id", farewellId)
        .single();

      if (data?.page_settings) {
        const settings = data.page_settings as Record<string, PageSetting>;
        const pageSetting = settings[pageKey];
        if (pageSetting) {
          setEnabled(pageSetting.enabled);
          setSetting(pageSetting);
        }
      }
      setLoading(false);
    };

    fetchSettings();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`farewell_settings_${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "farewells",
          filter: `id=eq.${farewellId}`,
        },
        (payload) => {
          const newSettings = payload.new.page_settings as Record<
            string,
            PageSetting
          >;
          if (newSettings && newSettings[pageKey]) {
            setEnabled(newSettings[pageKey].enabled);
            setSetting(newSettings[pageKey]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, pageKey, supabase]);

  if (loading) return null; // Or a spinner

  if (enabled || bypass) return <>{children}</>;

  // Locked State UI
  if (fallback) return <>{fallback}</>;

  const getIcon = () => {
    switch (setting?.reason) {
      case "maintenance":
        return Construction;
      case "coming_soon":
        return Clock;
      default:
        return Lock;
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-300">
      <div className="p-6 rounded-full bg-white/5 border border-white/10 mb-6">
        <Icon className="h-12 w-12 text-primary/80" />
      </div>
      <h2 className="text-2xl font-bold mb-3">
        {setting?.reason === "coming_soon"
          ? "Coming Soon"
          : "Access Restricted"}
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {setting?.message || "This page is currently unavailable."}
      </p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href={`/dashboard/${farewellId}`}>Back to Dashboard</Link>
      </Button>
    </div>
  );
}
