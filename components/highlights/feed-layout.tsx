"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Highlight,
  getHighlightsAction,
  getPendingHighlightsAction,
} from "@/app/actions/dashboard-actions";
import { HighlightCardV2 } from "./highlight-card-v2";
import { FeedSkeleton } from "./feed-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateHighlightDialog } from "@/components/dashboard/create-highlight-dialog";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { ShieldAlert, Sparkles, Clock, TrendingUp } from "lucide-react";

interface FeedLayoutProps {
  initialHighlights: Highlight[];
  farewellId: string;
}

export function FeedLayout({ initialHighlights, farewellId }: FeedLayoutProps) {
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("latest");
  const [highlights, setHighlights] = useState(initialHighlights);
  const [pendingHighlights, setPendingHighlights] = useState<Highlight[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    setHighlights(initialHighlights);
  }, [initialHighlights]);

  useEffect(() => {
    // Realtime Subscription
    const channel = supabase
      .channel("highlights-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "highlights",
          // Removed filter string to avoid potential formatting issues; filtering in callback
        },
        async (payload) => {
          // Manually filter by farewell_id to ensure we only react to relevant events
          const newRecord = payload.new as Highlight | null;
          const oldRecord = payload.old as Highlight | null;

          const relevantId = newRecord?.farewell_id || oldRecord?.farewell_id;
          if (relevantId !== farewellId) return;

          console.log("Realtime change detected:", payload.eventType);

          // For INSERT/UPDATE/DELETE, simply refetch the lists to ensure consistency
          // (Fetching is safer than manual state merge because we need joined user data)

          const newHighlights = await getHighlightsAction(farewellId);
          setHighlights(newHighlights);

          if (isAdmin) {
            // Always refresh pending if admin, regardless of tab, so badge updates
            const newPending = await getPendingHighlightsAction(farewellId);
            setPendingHighlights(newPending);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, isAdmin]); // Removed activeTab dependency to prevent churn

  // Fetch pending only if Admin and tab is active
  useEffect(() => {
    if (isAdmin && activeTab === "moderation") {
      setLoadingPending(true);
      getPendingHighlightsAction(farewellId)
        .then(setPendingHighlights)
        .finally(() => setLoadingPending(false));
    }
  }, [isAdmin, activeTab, farewellId]);

  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === "approved") {
      // Move from pending to main list locally
      const item = pendingHighlights.find((h) => h.id === id);
      if (item) {
        setPendingHighlights((prev) => prev.filter((h) => h.id !== id));
        setHighlights((prev) => [{ ...item, status: "approved" }, ...prev]);
      }
    } else {
      // Remove from pending
      setPendingHighlights((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handlePostDelete = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setPendingHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-muted/50 p-1 h-11 rounded-xl">
            <TabsTrigger
              value="latest"
              className="rounded-lg gap-2 text-xs font-medium"
            >
              <Clock className="w-4 h-4" /> Latest
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-lg gap-2 text-xs font-medium"
            >
              <TrendingUp className="w-4 h-4" /> Trending
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="moderation"
                className="rounded-lg gap-2 text-xs font-medium text-amber-600 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:text-amber-500 dark:data-[state=active]:bg-amber-900/20"
              >
                <ShieldAlert className="w-4 h-4" />
                Review
                {pendingHighlights.length > 0 && (
                  <span className="ml-1 bg-amber-600 text-white text-[10px] px-1.5 rounded-full">
                    {pendingHighlights.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <CreateHighlightDialog farewellId={farewellId} />
        </div>

        <TabsContent value="latest" className="m-0 focus-visible:ring-0">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {(highlights || []).map((highlight) => (
              <div key={highlight.id} className="break-inside-avoid">
                <HighlightCardV2
                  highlight={highlight}
                  isAdmin={isAdmin}
                  onDelete={handlePostDelete}
                />
              </div>
            ))}
            {(highlights || []).length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                <Sparkles className="w-12 h-12 opacity-20" />
                <p>No highlights yet. Be the first to share a memory!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="m-0 focus-visible:ring-0">
          <div className="text-center py-20 text-muted-foreground">
            Trending algorithm coming soon!
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="moderation" className="m-0 focus-visible:ring-0">
            {loadingPending ? (
              <FeedSkeleton />
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {(pendingHighlights || []).map((highlight) => (
                  <div key={highlight.id} className="break-inside-avoid">
                    <HighlightCardV2
                      highlight={highlight}
                      isAdmin={true}
                      onStatusChange={handleStatusChange}
                      onDelete={handlePostDelete}
                    />
                  </div>
                ))}
                {(pendingHighlights || []).length === 0 && (
                  <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                    <ShieldAlert className="w-12 h-12 opacity-20 text-green-500" />
                    <p>All caught up! No pending posts.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}




