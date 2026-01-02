import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Background Spinner */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>

      <div className="opacity-50 space-y-8 p-4 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-zinc-800/50" />
            <Skeleton className="h-4 w-64 bg-zinc-800/30" />
          </div>
          <Skeleton className="h-10 w-32 bg-zinc-800/50" />
        </div>

        {/* Gallery Grid (Masonry feel) */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 px-2 space-y-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <Skeleton
                className={`w-full rounded-2xl bg-zinc-900/40 border border-white/10
                  ${
                    i % 3 === 0
                      ? "aspect-[3/4]"
                      : i % 2 === 0
                      ? "aspect-video"
                      : "aspect-square"
                  }
                `}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
