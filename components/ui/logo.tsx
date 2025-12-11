"use client";

import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string; // For the outer container
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: { container: "w-8 h-8 rounded-lg", icon: "w-4 h-4" },
    md: { container: "w-10 h-10 rounded-xl", icon: "w-6 h-6" },
    lg: { container: "w-16 h-16 rounded-2xl", icon: "w-8 h-8" },
    xl: { container: "w-32 h-32 rounded-3xl", icon: "w-16 h-16" },
  };

  const { container, icon } = sizeClasses[size];

  return (
    <div
      className={cn(
        "bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg border border-white/10 relative z-10",
        container,
        className
      )}
    >
      <GraduationCap className={cn("text-white", icon)} />
    </div>
  );
}
