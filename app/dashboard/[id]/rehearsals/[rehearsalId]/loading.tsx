import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RehearsalLoading() {
  return (
    <div className="flex flex-col min-h-screen relative animate-in fade-in duration-500">
      {/* Sticky Header Skeleton */}
      <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b backdrop-blur z-20 sticky top-0 bg-background/80">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div className="h-4 w-px bg-border/40 hidden sm:block" />
          <Skeleton className="h-6 w-48 hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="h-4 w-px bg-border/40 mx-2" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <main className="flex-1 p-2 sm:p-4 w-full max-w-[1600px] mx-auto space-y-4 relative z-10 pb-32">
        {/* Hero Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="sticky top-[60px] z-10 py-1 bg-background/95 backdrop-blur w-full border-b mb-4">
          <div className="flex gap-2 pb-1">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="h-full bg-transparent border-muted/40">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
