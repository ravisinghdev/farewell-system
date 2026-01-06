"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getPerformancesAction,
  createPerformanceAction,
  deletePerformanceAction,
} from "@/app/actions/event-actions";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  BarChart3,
  Settings2,
  Activity,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { PerformanceCard } from "@/components/performances/performance-card";
import { Performance } from "@/types/performance";
import { createClient } from "@/utils/supabase/client";

export default function PerformancesPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [risk, setRisk] = useState("low");
  const [duration, setDuration] = useState("300"); // 5 mins in seconds
  const [performerNames, setPerformerNames] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformances();

    // Realtime Subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`performances-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "performances",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          fetchPerformances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  async function fetchPerformances() {
    const result = await getPerformancesAction(farewellId);
    if (result.data) {
      setPerformances(result.data as unknown as Performance[]);
    }
    setLoading(false);
  }

  function handleEdit(performance: Performance) {
    setTitle(performance.title);
    setType(performance.type);
    setRisk(performance.risk_level || "low");
    setDuration(performance.duration_seconds?.toString() || "300");
    //   setPerformerNames(performance.performers?.join(', ') || '');
    setEditingId(performance.id);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!title || !type) {
      toast.error("Error", { description: "Title and Type are required" });
      return;
    }

    const performersList = performerNames
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let result;
    if (editingId) {
      // Update
      result = await import("@/app/actions/event-actions").then((m) =>
        m.updatePerformanceAction(editingId, farewellId, {
          title,
          type,
          risk_level: risk,
          duration_seconds: parseInt(duration) || 300,
          performers: performersList,
        })
      );
    } else {
      // Create
      result = await createPerformanceAction(farewellId, {
        title,
        type,
        performers: performersList,
        risk_level: risk,
        duration_seconds: parseInt(duration) || 300,
      });
    }

    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      toast.success("Success", {
        description: editingId
          ? "Performance Updated"
          : "Performance Draft Created",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchPerformances();
    }
  }

  function resetForm() {
    setTitle("");
    setType("");
    setRisk("low");
    setDuration("300");
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this performance? Use with caution.")) return;
    const result = await deletePerformanceAction(id, farewellId);
    if (!result.error) {
      toast.success("Deleted", { description: "Performance removed." });
      fetchPerformances();
    }
  }

  async function handleToggleLock(id: string, current: boolean) {
    toast.info("Lock toggling coming next update!");
  }

  async function handleApprove(id: string) {
    const result = await import("@/app/actions/event-actions").then((m) =>
      m.updatePerformanceStatusAction(id, farewellId, "approved")
    );
    if (result.error) {
      toast.error("Failed to approve", { description: result.error });
    } else {
      toast.success("Performance Approved!", {
        description: "Rehearsal schedule has been auto-generated.",
      });
      fetchPerformances();
    }
  }

  async function handleDuplicate(id: string) {
    const result = await import("@/app/actions/event-actions").then((m) =>
      m.duplicatePerformanceAction(id, farewellId)
    );
    if (result.error) {
      toast.error("Duplicate Failed", { description: result.error });
    } else {
      toast.success("Duplicated", {
        description: "Performance copy created in Drafts.",
      });
      fetchPerformances();
    }
  }

  // Calculate Health Stats
  const avgHealth =
    performances.length > 0
      ? Math.round(
          performances.reduce((acc, p) => acc + (p.health_score || 0), 0) /
            performances.length
        )
      : 0;

  const highRiskCount = performances.filter(
    (p) => p.risk_level === "high"
  ).length;

  return (
    <PageScaffold
      title="Performance Registry"
      description="The official source of truth for all farewell acts."
      action={
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Performance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Performance" : "Register New Act"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update performance details."
                  : "Initialize a structured performance object."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Performance Title</Label>
                <Input
                  placeholder="e.g. The Final Flash Mob"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dance">Dance</SelectItem>
                      <SelectItem value="couple">Pair / Duo</SelectItem>
                      <SelectItem value="group">Group Act</SelectItem>
                      <SelectItem value="skit">Skit</SelectItem>
                      <SelectItem value="band">Band/Music</SelectItem>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="special_act">Special Act</SelectItem>
                      <SelectItem value="anchor_segment">
                        Anchor Segment
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Risk Assessment</Label>
                  <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger>
                      <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Simple)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Complex/Risky)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Est. Duration (Seconds)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingId ? "Save Changes" : "Initialize Act"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Health Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/10 rounded-full">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Acts</p>
            <h3 className="text-2xl font-bold">{performances.length}</h3>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-500/10 rounded-full">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Readiness</p>
            <h3 className="text-2xl font-bold">{avgHealth}%</h3>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">High Risk Acts</p>
            <h3 className="text-2xl font-bold">{highRiskCount}</h3>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Duration</p>
            <h3 className="text-2xl font-bold">
              {Math.floor(
                performances.reduce(
                  (acc, s) => acc + (s.duration_seconds || 0),
                  0
                ) / 60
              )}
              m
            </h3>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Tabs defaultValue="all" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="all">All Acts</TabsTrigger>
            <TabsTrigger value="risk">High Risk</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">Loading registry...</div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {performances.map((performance) => (
            <PerformanceCard
              key={performance.id}
              performance={performance}
              isAdmin={isAdmin}
              onEdit={() => handleEdit(performance)}
              onDelete={handleDelete}
              onToggleLock={handleToggleLock}
              onApprove={handleApprove}
              onDuplicate={handleDuplicate}
            />
          ))}
          {performances.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
              <h3 className="text-xl font-medium text-muted-foreground">
                Registry Empty
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Initialize the first performance to begin planning.
              </p>
            </div>
          )}
        </div>
      )}
    </PageScaffold>
  );
}
