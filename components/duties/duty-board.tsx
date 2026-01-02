"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Duty } from "@/types/duties";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateDutyDialog } from "./create-duty-dialog";
import { DutyCard } from "./duty-card";

interface DutyBoardProps {
  initialDuties: Duty[];
  farewellId: string;
  currentUserRole: string;
  currentUserId: string;
}

export function DutyBoard({
  initialDuties,
  farewellId,
  currentUserRole,
  currentUserId,
}: DutyBoardProps) {
  const [duties, setDuties] = useState<Duty[]>(initialDuties);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Sync with prop updates from router.refresh()
  useEffect(() => {
    setDuties(initialDuties);
  }, [initialDuties]);

  useEffect(() => {
    // Realtime subscription for duties and related tables
    const channel = supabase
      .channel("duties_realtime_board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duties" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duty_assignments" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duty_claims" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duty_votes" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_receipts" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  // TODO: Also subscribe to assignments to update local assignment cache if we embed them in duty object.
  // Ideally, DutyCard should handle assignment fetching/subscriptions individually or we fetch deep on change.
  // For now, assuming initialDuties has assignments but realtime updates might miss assignments unless we subscribe to them too.
  // Simplest is to have DutyCard fetch its own live details or subscribe to assignments filtered by duty_id.

  const isAdmin = ["main_admin", "parallel_admin", "admin"].includes(
    currentUserRole
  );

  const categories = Array.from(new Set(duties.map((d) => d.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="all">All Duties</TabsTrigger>
            <TabsTrigger value="my_duties">My Assignments</TabsTrigger>
            <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          </TabsList>
        </Tabs>

        {isAdmin && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Duty
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {duties.map((duty) => (
          <DutyCard
            key={duty.id}
            duty={duty}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        ))}
      </div>

      <CreateDutyDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        farewellId={farewellId}
      />
    </div>
  );
}




