import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent relative">
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
      <div className="opacity-50 space-y-4 h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-4 sm:p-8 border-b border-white/5 bg-gradient-to-r from-background via-background to-transparent z-10 sticky top-0 backdrop-blur-md">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 bg-zinc-800/50" />
            <Skeleton className="h-4 w-64 bg-zinc-800/30 hidden sm:block" />
          </div>
          <Skeleton className="h-10 w-32 bg-zinc-800/50" />
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-hidden">
          <div className="h-full space-y-4 max-w-4xl mx-auto">
            {/* Announcement Card Skeletons */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/50" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-zinc-800/50" />
                      <Skeleton className="h-3 w-20 bg-zinc-800/30" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full bg-zinc-800/50" />
                </div>

                <div className="space-y-2 pl-13">
                  <Skeleton className="h-5 w-3/4 bg-zinc-800/50" />
                  <Skeleton className="h-4 w-full bg-zinc-800/30" />
                  <Skeleton className="h-4 w-full bg-zinc-800/30" />
                  <Skeleton className="h-4 w-2/3 bg-zinc-800/30" />
                </div>

                <div className="pt-4 flex gap-3">
                  <Skeleton className="h-8 w-24 rounded-full bg-zinc-800/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
