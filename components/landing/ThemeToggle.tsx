// components/landing/ThemeToggle.tsx
"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();

  const current = theme === "system" ? systemTheme : theme;

  return (
    <div className="inline-flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // cycle: system -> light -> dark -> system
          const next =
            theme === "system"
              ? "light"
              : theme === "light"
              ? "dark"
              : "system";
          setTheme(next);
        }}
      >
        {current === "dark" ? "Dark" : current === "light" ? "Light" : "System"}
      </Button>
    </div>
  );
}
