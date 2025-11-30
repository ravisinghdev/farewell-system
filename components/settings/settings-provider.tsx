"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SettingsContextType {
  settings: any;
  updateSettings: (key: string, value: any) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({
  children,
  initialSettings,
  userId,
}: {
  children: React.ReactNode;
  initialSettings: any;
  userId: string;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Settings changed:", payload);
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            setSettings((prev: any) => ({ ...prev, ...payload.new }));
            toast.info("Settings updated from another device");
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, router]);

  const updateSettingsOptimistic = async (key: string, value: any) => {
    // Optimistic update
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings: updateSettingsOptimistic }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
