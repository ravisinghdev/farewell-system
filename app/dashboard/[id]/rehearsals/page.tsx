"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
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
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

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
        isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Rehearsal Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Linked Performance (Optional)</Label>
                  <Select
                    value={performanceId}
                    onValueChange={setPerformanceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Act" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        General (No specific act)
                      </SelectItem>
                      {performances.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Session Title</Label>
                  <Input
                    placeholder="e.g. Full Run-Through"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input
                      placeholder="Room/Stage"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Goal / Notes</Label>
                  <Textarea
                    placeholder="Focus for this session..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Session"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    >
      {loading ? (
        <div className="text-center py-10">Loading schedule...</div>
      ) : rehearsals.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-muted/10">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Sessions Scheduled</h3>
          <p className="text-muted-foreground mt-1">
            Time to get to work. Schedule the first rehearsal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rehearsals.map((rehearsal) => (
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
