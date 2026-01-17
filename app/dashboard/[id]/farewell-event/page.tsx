"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFarewell } from "@/components/providers/farewell-provider";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getEventDetailsAction,
  getPerformancesAction,
  getTimelineBlocksAction,
  updatePerformanceStatusAction,
  deletePerformanceAction,
  voteForPerformanceAction,
  removeVoteForPerformanceAction,
  toggleTimelineBlockHypeAction,
} from "@/app/actions/event-actions";
import { isFarewellAdmin } from "@/lib/auth/roles-server"; // Warning: server import in client comp? No.
// We should check role from provider or pass it down. useFarewell (client) usually gives role.
// Or we fetch it.
// Let's use `useFarewell` if it provides role, or a separate fetch.
// Actually, `useFarewell` context usually provides `role`.
// Let's check `FarewellProvider`... assuming it exposes `role`.
// If not, we might need to pass it or fetch it.
// Previous page scaffold had `isAdmin` logic.
// The previous page.tsx used `createClient` and fetched role.
// Since this is a Client Component (Hook usage), we can't easily use server utils directly in body.
// We will fetch role in `useEffect`.

import { EventHero } from "@/components/farewell-event/event-hero";
import { PerformanceShowcase } from "@/components/farewell-event/performance-showcase";
import { LiveTimeline } from "@/components/farewell-event/live-timeline";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function FarewellEventPage() {
  const { id: farewellId } = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Data State
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [performances, setPerformances] = useState<any[]>([]);
  const [timelineBlocks, setTimelineBlocks] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  // Settings for fallback
  const [farewellSettings, setFarewellSettings] = useState<any>(null);

  useEffect(() => {
    checkRoleAndFetch();
  }, [farewellId]);

  const checkRoleAndFetch = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check Admin Role
        // We can't use the server helper here. We'll check via RPC or table.
        // Simplified: Fetch user role from `farewell_members`
        const { data: member } = await supabase
          .from("farewell_members")
          .select("role")
          .eq("farewell_id", farewellId)
          .eq("user_id", user.id)
          .single();

        setIsAdmin(member?.role === "admin" || member?.role === "owner");

        // Fetch User Votes
        const { data: votes } = await supabase
          .from("performance_votes")
          .select("performance_id")
          .eq("user_id", user.id);

        if (votes) {
          setUserVotes(new Set(votes.map((v) => v.performance_id)));
        }
      }

      // Fetch Data Parallel
      const [detailsRes, perfsRes, timelineRes, farewellRes] =
        await Promise.all([
          getEventDetailsAction(farewellId),
          getPerformancesAction(farewellId),
          getTimelineBlocksAction(farewellId),
          supabase
            .from("farewells")
            .select("*, settings")
            .eq("id", farewellId)
            .single(),
        ]);

      setEventDetails(detailsRes);
      setPerformances(perfsRes.data || []);
      setTimelineBlocks(timelineRes.data || []);
      setFarewellSettings(farewellRes.data?.settings || {});
    } catch (err) {
      console.error(err);
      toast.error("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleVote = async (perfId: string) => {
    // Optimistic update
    const isVoted = userVotes.has(perfId);
    const newVotes = new Set(userVotes);
    if (isVoted) newVotes.delete(perfId);
    else newVotes.add(perfId);
    setUserVotes(newVotes);

    const res = isVoted
      ? await removeVoteForPerformanceAction(perfId)
      : await voteForPerformanceAction(perfId);

    if (res?.error) {
      toast.error("Vote failed");
      // Revert
      setUserVotes(userVotes);
    } else {
      toast.success(isVoted ? "Vote removed" : "Vote recorded!");
      // Ideally re-fetch to get count update, or custom logic to inc/dec count locally
    }
  };

  const handleHype = async (blockId: string) => {
    // Optimistic
    setTimelineBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            has_liked: !b.has_liked,
            reaction_count: b.has_liked
              ? b.reaction_count - 1
              : b.reaction_count + 1,
          };
        }
        return b;
      })
    );

    const res = await toggleTimelineBlockHypeAction(blockId);
    if (res?.error) {
      toast.error("Action failed");
      // Revert logic would go here
    }
  };

  // Admin Handlers (Stubs mostly, connecting real actions)
  const handleDeletePerf = async (id: string) => {
    if (!confirm("Delete this performance?")) return;
    await deletePerformanceAction(id, farewellId);
    setPerformances((prev) => prev.filter((p) => p.id !== id));
    toast.success("Deleted");
  };

  const handleToggleLock = async (id: string, current: boolean) => {
    // Need action for locking specifically or updatePerformance
    // Using generic update for now or stub
    toast.info("Locking feature coming soon");
  };

  const handleApprovePerf = async (id: string) => {
    // Optimistic
    setPerformances((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
    );
    await updatePerformanceStatusAction(id, farewellId, "approved");
    toast.success("Performance Approved");
  };

  // Derived State
  const eventDate = useMemo(() => {
    const settingsDate = farewellSettings?.general?.event_date;
    if (settingsDate) return new Date(settingsDate);
    if (eventDetails?.event_date) return new Date(eventDetails.event_date);
    return null;
  }, [farewellSettings, eventDetails]);

  const isEventPast = eventDate ? new Date() > eventDate : false;

  if (loading) {
    return (
      <PageScaffold title="Loading...">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold title="Main Event" className="space-y-8">
      <EventHero
        farewellName={
          farewellSettings?.general?.farewell_name || "Farewell Event"
        }
        eventDate={eventDate}
        venue={eventDetails?.venue}
        isEventPast={isEventPast}
        isAdmin={isAdmin}
        onEdit={() => toast.info("Edit Event Details dialog to be implemented")}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b border-border rounded-none gap-2">
          <TabsTrigger
            value="overview"
            className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Run of Show
          </TabsTrigger>
          <TabsTrigger
            value="performances"
            className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Performances
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            {/* Stats or Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Acts" value={performances.length} />
              <StatCard
                label="Approved"
                value={
                  performances.filter((p) => p.status === "approved").length
                }
              />
              <StatCard label="Timeline Blocks" value={timelineBlocks.length} />
              <StatCard label="My Votes" value={userVotes.size} />
            </div>

            {/* Preview of Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Coming Up Next</h3>
                <Button variant="link" onClick={() => setActiveTab("timeline")}>
                  View Full Timeline
                </Button>
              </div>
              <LiveTimeline
                blocks={timelineBlocks.slice(0, 3)}
                isAdmin={false} // Read-only prev
                onHype={handleHype} // Still allow hype
              />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <LiveTimeline
              blocks={timelineBlocks}
              isAdmin={isAdmin}
              onHype={handleHype}
              onEdit={(b) => toast.info(`Edit block ${b.title}`)}
            />
          </TabsContent>

          <TabsContent value="performances">
            <PerformanceShowcase
              performances={performances}
              isAdmin={isAdmin}
              userVotes={userVotes}
              onEdit={(p) => toast.info(`Edit ${p.title}`)}
              onDelete={handleDeletePerf}
              onToggleLock={handleToggleLock}
              onApprove={handleApprovePerf}
              onVote={handleVote}
            />
          </TabsContent>
        </div>
      </Tabs>
    </PageScaffold>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
