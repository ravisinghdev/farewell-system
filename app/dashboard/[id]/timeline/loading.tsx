import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Background Spinner */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>

      <div className="opacity-50 space-y-8 p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-zinc-800/50" />
            <Skeleton className="h-4 w-64 bg-zinc-800/30" />
          </div>
          <Skeleton className="h-10 w-32 bg-zinc-800/50" />
        </div>

        {/* Timeline Skeleton */}
        <div className="relative pl-8 border-l border-white/10 space-y-12">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <Skeleton className="absolute -left-[37px] top-2 h-4 w-4 rounded-full bg-zinc-800/50 border-4 border-background" />

              {/* Content Card */}
              <div className="space-y-3 bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32 bg-zinc-800/50" />
                    <Skeleton className="h-4 w-24 bg-zinc-800/30" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full bg-zinc-800/40" />
                </div>
                <Skeleton className="h-4 w-full bg-zinc-800/30" />
                <Skeleton className="h-4 w-3/4 bg-zinc-800/30" />

                {/* Images mock */}
                {i % 2 === 0 && (
                  <div className="pt-4 grid grid-cols-3 gap-2">
                    <Skeleton className="aspect-video rounded-lg bg-zinc-800/40" />
                    <Skeleton className="aspect-video rounded-lg bg-zinc-800/40" />
                    <Skeleton className="aspect-video rounded-lg bg-zinc-800/40" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
