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
            <Skeleton className="h-8 w-56 bg-zinc-800/50" />
            <Skeleton className="h-4 w-72 bg-zinc-800/30" />
          </div>
          <Skeleton className="h-10 w-32 bg-zinc-800/50" />
        </div>

        {/* Featured Highlight (Hero) */}
        <div className="w-full aspect-[21/9] rounded-3xl bg-zinc-900/40 border border-white/10 relative overflow-hidden">
          <Skeleton className="absolute inset-0 bg-zinc-800/20" />
          <div className="absolute bottom-0 left-0 p-8 space-y-4 w-full">
            <Skeleton className="h-8 w-1/3 bg-zinc-800/50" />
            <Skeleton className="h-4 w-1/2 bg-zinc-800/30" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-2xl bg-zinc-900/40 border border-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 bg-zinc-800/50" />
                <Skeleton className="h-4 w-full bg-zinc-800/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
