import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative h-screen bg-transparent overflow-hidden flex flex-col">
      {/* Background Spinner */}
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>

      <div className="opacity-50 flex-1 flex flex-col p-4 sm:p-6 max-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pl-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-zinc-800/50" />
            <Skeleton className="h-4 w-64 bg-zinc-800/30" />
          </div>
          <Skeleton className="h-10 w-32 bg-zinc-800/50 rounded-full" />
        </div>

        {/* Chat Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          {/* Channels Sidebar (Hidden on mobile usually, but skeleton shows structure) */}
          <div className="hidden lg:block lg:col-span-1 border border-white/10 bg-white/5 rounded-3xl p-4 space-y-4">
            <Skeleton className="h-10 w-full bg-zinc-800/40 rounded-xl" />
            <div className="space-y-2 pt-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 w-full bg-zinc-800/30 rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="col-span-1 lg:col-span-3 border border-white/10 bg-white/5 rounded-3xl flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-6">
              <Skeleton className="h-6 w-40 bg-zinc-800/50" />
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 space-y-6 flex flex-col-reverse">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`flex gap-4 max-w-[80%] ${
                    i % 2 === 0 ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/50 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton
                      className={`h-16 w-64 rounded-2xl bg-zinc-800/${
                        i % 2 === 0 ? "30" : "40"
                      }`}
                    />
                    <Skeleton className="h-3 w-20 bg-zinc-800/20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="h-20 border-t border-white/10 p-4">
              <Skeleton className="h-full w-full rounded-2xl bg-zinc-800/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
