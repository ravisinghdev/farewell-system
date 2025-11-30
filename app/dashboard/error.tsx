"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4">
      <GlassCard className="flex flex-col items-center gap-6 p-8 max-w-md text-center border-red-500/20 bg-red-500/5">
        <div className="rounded-full bg-red-500/10 p-4 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Something went wrong!
          </h2>
          <p className="text-white/60 text-sm">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => reset()}
            variant="default"
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-white/10 hover:bg-white/5"
          >
            Reload Page
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
