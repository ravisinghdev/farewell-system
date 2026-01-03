"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, MapPin, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getRehearsalsAction,
  getPerformancesAction,
} from "@/app/actions/event-actions"; // Note: Importing from event-actions now
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Performance } from "@/types/performance";
import {
  createRehearsalAction,
  deleteRehearsalAction,
} from "@/app/actions/rehearsal-actions";
import Link from "next/link";

export default function RehearsalsPage() {
  return (
    <Suspense
      fallback={
        <PageScaffold
          title="Rehearsals & Planning"
          description="Military-grade scheduling for all practices."
        >
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </PageScaffold>
      }
    >
      <RehearsalsContent />
    </Suspense>
  );
}

function RehearsalsContent() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const searchParams = useSearchParams();
  const filterPerfId = searchParams.get("performanceId");

  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [performanceId, setPerformanceId] = useState<string>("general"); // 'general' or UUID

  useEffect(() => {
    fetchData();
  }, [farewellId]);

  async function fetchData() {
    setLoading(true);
    const [rehearsalData, perfData] = await Promise.all([
      getRehearsalsAction(farewellId),
      getPerformancesAction(farewellId),
    ]);

    setRehearsals(rehearsalData);
    if (perfData.data)
      setPerformances(perfData.data as unknown as Performance[]);
    setLoading(false);
  }

  // Filter Logic
  const filteredRehearsals = filterPerfId
    ? rehearsals.filter((r) => r.performance_id === filterPerfId)
    : rehearsals;

  const activePerformanceName = performances.find(
    (p) => p.id === filterPerfId
  )?.title;

  async function handleCreate() {
    if (!title || !date || !startTime || !endTime) {
      toast.error("Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      const result = await createRehearsalAction(farewellId, {
        title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        venue,
        description,
        rehearsal_type: performanceId === "general" ? "general" : "specific",
        performance_id: performanceId === "general" ? undefined : performanceId,
      });

      if (result.error) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Success", { description: "Session scheduled." });
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to schedule");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to cancel this session?")) return;
    const result = await deleteRehearsalAction(id, farewellId);
    if (!result.error) {
      toast.success("Cancelled session");
      fetchData();
    }
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setVenue("");
    setDescription("");
    setPerformanceId("general");
  }

  return (
    <PageScaffold
      title="Rehearsals & Planning"
      description="Military-grade scheduling for all practices."
      action={
        // Manual creation disabled - Auto-generated from Performances
        // isAdmin && ( ... Dialog code ... )
        null
      }
    >
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg mb-6 flex items-start gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full mt-0.5">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
            Automated Scheduling Only
          </h4>
          <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1">
            Rehearsals are automatically created when a Performance is marked as{" "}
            <strong>Approved</strong>. To schedule a new session, go to{" "}
            <Link
              href={`/dashboard/${farewellId}/performances`}
              className="underline underline-offset-2 hover:text-amber-900"
            >
              Performances
            </Link>{" "}
            and approve an act.
          </p>
        </div>
      </div>
      {filterPerfId && (
        <div className="mb-6 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              Filtered
            </Badge>
            <span className="text-sm text-foreground/80">
              Showing rehearsals for{" "}
              <strong>{activePerformanceName || "Selected Performance"}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            <Link href={`/dashboard/${farewellId}/rehearsals`}>
              <X className="w-4 h-4 mr-1" /> Clear Filter
            </Link>
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Loading schedule...</div>
      ) : filteredRehearsals.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-muted/10">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Sessions Scheduled</h3>
          <p className="text-muted-foreground mt-1">
            {filterPerfId
              ? "No rehearsals found for this performance."
              : "Time to get to work. Schedule the first rehearsal."}
          </p>
          {filterPerfId && (
            <Button variant="link" asChild className="mt-2">
              <Link href={`/dashboard/${farewellId}/rehearsals`}>
                View All Sessions
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRehearsals.map((rehearsal) => (
            <Card key={rehearsal.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row border-l-4 border-l-primary">
                {/* Date Block */}
                <div className="bg-muted/30 p-4 flex flex-col items-center justify-center min-w-[100px] border-r">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {format(new Date(rehearsal.start_time), "MMM")}
                  </span>
                  <span className="text-2xl font-bold">
                    {format(new Date(rehearsal.start_time), "dd")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(rehearsal.start_time), "EEE")}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {rehearsal.title}
                        </h3>
                        {rehearsal.performance && (
                          <Badge variant="secondary" className="text-[10px]">
                            For: {rehearsal.performance.title}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(
                            new Date(rehearsal.start_time),
                            "h:mm a"
                          )} - {format(new Date(rehearsal.end_time), "h:mm a")}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rehearsal.venue || "TBD"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/dashboard/${farewellId}/rehearsals/${rehearsal.id}`}
                        >
                          Enter Room
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-8 px-2"
                          onClick={() => handleDelete(rehearsal.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {rehearsal.goal && (
                    <div className="bg-secondary/50 p-2 rounded text-sm mt-2 text-secondary-foreground border border-secondary">
                      <span className="font-medium text-xs uppercase tracking-wide opacity-70 mr-2">
                        Goal:
                      </span>
                      {rehearsal.goal}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
