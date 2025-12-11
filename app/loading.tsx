"use client";

import { Logo } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Logo size="lg" className="animate-bounce-slow shadow-2xl" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
