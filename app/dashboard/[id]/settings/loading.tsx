import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-transparent p-4 sm:p-8">
      {/* Background Spinner */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>

      <div className="opacity-50 max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800/50" />
          <Skeleton className="h-4 w-96 bg-zinc-800/30" />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full bg-zinc-800/50" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 bg-zinc-800/50" />
                <Skeleton className="h-4 w-32 bg-zinc-800/30" />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-zinc-800/40" />
                  <Skeleton className="h-10 w-full bg-zinc-800/20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
