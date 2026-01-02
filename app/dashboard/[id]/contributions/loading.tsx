import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Background Spinner */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>

      <div className="opacity-50 space-y-8 p-4 sm:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 bg-zinc-800/50" />
          <Skeleton className="h-4 w-96 bg-zinc-800/30" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between"
            >
              <Skeleton className="h-8 w-8 rounded-full bg-zinc-800/50" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 bg-zinc-800/50" />
                <Skeleton className="h-4 w-24 bg-zinc-800/30" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart/List Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 h-[400px]">
              <div className="flex justify-between mb-6">
                <Skeleton className="h-6 w-48 bg-zinc-800/50" />
                <Skeleton className="h-8 w-32 bg-zinc-800/40" />
              </div>
              <Skeleton className="w-full h-[300px] bg-zinc-800/20 rounded-xl" />
            </div>

            {/* List Items */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/50" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3 bg-zinc-800/50" />
                    <Skeleton className="h-3 w-1/4 bg-zinc-800/30" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-zinc-800/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 h-[300px]">
              <Skeleton className="h-6 w-32 bg-zinc-800/50 mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-full bg-zinc-800/30 rounded-xl"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
