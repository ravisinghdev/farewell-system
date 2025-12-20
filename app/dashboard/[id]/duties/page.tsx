import { Suspense } from "react";
import { getDutiesAction } from "@/app/actions/duty-actions";
import { createClient } from "@/utils/supabase/server";
import { isFarewellAdmin } from "@/lib/auth/roles-server";
import { DutyHero } from "@/components/duties/v4/duty-hero";
import { FinancialOverview } from "@/components/duties/v4/financial-overview";
import { KanbanBoard } from "@/components/duties/v4/kanban-board";
import { VolunteerLeaderboard } from "@/components/duties/v4/volunteer-leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function DutiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user ? await isFarewellAdmin(id, user.id) : false;
  const duties = await getDutiesAction(id);

  // Fetch all members for assignment picker
  const { data: membersData } = await supabase
    .from("farewell_members")
    .select("user:users(id, full_name, avatar_url)")
    .eq("farewell_id", id)
    .eq("status", "approved");

  const allMembers = membersData?.map((m: any) => m.user).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-black/95 text-white p-6 pb-20 relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <DutyHero />

        <FinancialOverview duties={duties} isAdmin={isAdmin} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Tabs defaultValue="board" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="board">Kanban Board</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                </TabsList>
                {/* Add Duty Button would go here */}
              </div>

              <TabsContent value="board" className="mt-0">
                <KanbanBoard
                  initialDuties={duties}
                  farewellId={id}
                  isAdmin={isAdmin}
                  allMembers={allMembers}
                  currentUserId={user?.id || ""}
                />
              </TabsContent>
              <TabsContent value="list">
                <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-xl border border-white/10">
                  List View Coming Soon
                </div>
              </TabsContent>
              <TabsContent value="calendar">
                <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-xl border border-white/10">
                  Calendar View Coming Soon
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Suspense
              fallback={
                <Skeleton className="h-[300px] w-full rounded-xl bg-white/5" />
              }
            >
              <VolunteerLeaderboard farewellId={id} />
            </Suspense>

            {/* Quick Actions / Recent Activity could go here */}
          </div>
        </div>
      </div>
    </div>
  );
}
