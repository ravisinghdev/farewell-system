"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  LayoutGrid,
  Kanban,
  List as ListIcon,
  Loader2,
} from "lucide-react";
import {
  getPerformancesAction,
  createPerformanceAction,
  deletePerformanceAction,
  updatePerformanceStatusAction,
} from "@/app/actions/event-actions";
import { Performance } from "@/types/performance";
import { PerformanceTable } from "@/components/performances/v2/performance-table";
// We can reuse the showcase grid/list logic or build a simpler one for V2 fallback
import { PerformanceShowcase } from "@/components/farewell-event/performance-showcase";
import { PerformanceDetailSheet } from "@/components/performances/v2/performance-detail-sheet";
import { PerformanceWizard } from "@/components/performances/v2/performance-wizard";

export default function PerformancesPageV2() {
  const { id: farewellId } = useParams() as { id: string };
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [wizardOpen, setWizardOpen] = useState(false);

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedPerformance, setSelectedPerformance] =
    useState<Performance | null>(null);

  useEffect(() => {
    fetchPerformances();
    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`performances-v2-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "performances",
          filter: `farewell_id=eq.${farewellId}`,
        },
        fetchPerformances
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  async function fetchPerformances() {
    const result = await getPerformancesAction(farewellId);
    if (result.data) {
      setPerformances(result.data as Performance[]);
    }
    setLoading(false);
  }

  // Actions
  const handleCreate = async (data: any) => {
    const result = await createPerformanceAction(farewellId, data);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Performance Created");
      fetchPerformances();
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    const result = await import("@/app/actions/event-actions").then((m) =>
      m.updatePerformanceAction(id, farewellId, updates)
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Updated");
      fetchPerformances();
      // Update selected perf if open (though fetching handles it usually)
      setSelectedPerformance((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic
    setPerformances((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus as any } : p))
    );

    const result = await updatePerformanceStatusAction(
      id,
      farewellId,
      newStatus
    );
    if (result.error) {
      toast.error(result.error);
      fetchPerformances(); // Revert
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    await deletePerformanceAction(id, farewellId);
    toast.success("Deleted");
  };

  const openDetailSheet = (p: Performance) => {
    setSelectedPerformance(p);
    setDetailSheetOpen(true);
  };

  return (
    <PageScaffold
      title="Performances"
      description="Manage the show flow, approvals, and rehearsals."
      action={
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Act
        </Button>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="table">
              <ListIcon className="w-4 h-4 mr-2" /> List
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="w-4 h-4 mr-2" /> Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="h-[calc(100vh-250px)]">
          {viewMode === "table" ? (
            <PerformanceTable
              data={performances}
              isAdmin={isAdmin}
              onStatusChange={(id, status) => handleStatusChange(id, status)}
              onEdit={openDetailSheet}
              onDelete={handleDelete}
            />
          ) : (
            <div className="overflow-y-auto h-full pr-2">
              <PerformanceShowcase
                performances={performances}
                isAdmin={isAdmin}
                onEdit={openDetailSheet}
                onDelete={handleDelete}
                onToggleLock={() => {}}
                onApprove={(id) => handleStatusChange(id, "ready")}
              />
            </div>
          )}
        </div>
      )}

      <PerformanceWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={handleCreate}
      />

      <PerformanceDetailSheet
        performance={selectedPerformance}
        isOpen={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        onSave={handleUpdate}
      />
    </PageScaffold>
  );
}
