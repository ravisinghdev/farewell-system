"use client";

import { useSettings } from "@/components/settings/settings-provider";
import { useEffect } from "react";

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply Font Size
    root.classList.remove("text-sm", "text-base", "text-lg");
    if (settings.font_size === "small") {
      root.style.fontSize = "14px";
    } else if (settings.font_size === "large") {
      root.style.fontSize = "18px";
    } else {
      root.style.fontSize = "16px";
    }

    // Apply Reduced Motion
    if (settings.reduced_motion) {
      root.classList.add("motion-reduce");
      // You might need to add CSS for this class if Tailwind's motion-reduce isn't enough
      // or if you want to force it globally
      root.style.setProperty("--transition-duration", "0s");
    } else {
      root.classList.remove("motion-reduce");
      root.style.removeProperty("--transition-duration");
    }
  }, [settings]);

  return <>{children}</>;
}
