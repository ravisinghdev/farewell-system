import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
      <div className="space-y-8 animate-pulse p-4 md:p-8 max-w-[1600px] mx-auto opacity-50">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-zinc-800/50" />
            <Skeleton className="h-4 w-96 bg-zinc-800/30" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-zinc-800/50" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-3xl bg-zinc-900/40 border border-white/5 p-5 flex flex-col justify-between"
            >
              <div className="flex justify-between">
                <Skeleton className="h-10 w-10 rounded-xl bg-zinc-800/50" />
                <Skeleton className="h-2 w-2 rounded-full bg-zinc-800/50" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-24 bg-zinc-800/50" />
                <Skeleton className="h-4 w-32 bg-zinc-800/30" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chart/Activity */}
            <div className="h-[400px] rounded-3xl bg-zinc-900/40 border border-white/5 p-6 space-y-4">
              <Skeleton className="h-6 w-48 bg-zinc-800/50" />
              <div className="h-full w-full flex items-end gap-2 pb-4">
                {[...Array(7)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-full bg-zinc-800/30 rounded-t-lg"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Feed */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 bg-zinc-800/50" />
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-zinc-900/30 border border-white/5 p-4 flex items-center gap-4"
                >
                  <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/50" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48 bg-zinc-800/50" />
                    <Skeleton className="h-3 w-32 bg-zinc-800/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Announcements */}
            <div className="h-[300px] rounded-3xl bg-zinc-900/40 border border-white/5 p-6 space-y-4">
              <Skeleton className="h-6 w-40 bg-zinc-800/50" />
              <Skeleton className="h-4 w-full bg-zinc-800/30" />
              <Skeleton className="h-4 w-3/4 bg-zinc-800/30" />
              <Skeleton className="h-4 w-full bg-zinc-800/30" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-24 rounded-2xl bg-zinc-900/40 border border-white/5"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
