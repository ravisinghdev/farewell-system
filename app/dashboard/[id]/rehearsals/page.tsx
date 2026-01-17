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
  getFarewellMembersAction,
} from "@/app/actions/rehearsal-actions";
import Link from "next/link";
import { RehearsalCard } from "@/components/rehearsals/rehearsal-card";

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
  const [members, setMembers] = useState<any[]>([]);
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
  const [rehearsalType, setRehearsalType] = useState<string>("general");
  const [pair1, setPair1] = useState<string>("");
  const [pair2, setPair2] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [farewellId]);

  async function fetchData() {
    setLoading(true);
    const [rehearsalData, perfData, membersData] = await Promise.all([
      getRehearsalsAction(farewellId),
      getPerformancesAction(farewellId),
      getFarewellMembersAction(farewellId),
    ]);

    setRehearsals(rehearsalData);
    if (perfData.data)
      setPerformances(perfData.data as unknown as Performance[]);
    if (membersData) setMembers(membersData);
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

    if (rehearsalType === "pair" && (!pair1 || !pair2)) {
      toast.error("Error", {
        description: "Please select both partners for the pair",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      // Construct metadata if pair
      let metadata = {};
      if (rehearsalType === "pair") {
        // Find user objects
        const p1 = members.find((m) => m.id === pair1);
        const p2 = members.find((m) => m.id === pair2);

        // Add to participants list automatically
        const pairParticipants = [];
        if (p1)
          pairParticipants.push({
            user_id: p1.id,
            name: p1.full_name,
            role: "Partner 1",
            avatar_url: p1.avatar_url,
          });
        if (p2)
          pairParticipants.push({
            user_id: p2.id,
            name: p2.full_name,
            role: "Partner 2",
            avatar_url: p2.avatar_url,
          });

        metadata = {
          participants: pairParticipants,
          is_pair: true,
        };
      }

      const result = await createRehearsalAction(farewellId, {
        title,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        venue,
        description,
        rehearsal_type: rehearsalType,
        performance_id: performanceId === "general" ? undefined : performanceId,
        metadata, // Pass initial metadata
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
      // action={
      //   isAdmin && (
      //     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      //       <DialogTrigger asChild>
      //         <Button onClick={() => resetForm()}>
      //           <Plus className="w-4 h-4 mr-2" /> Schedule Session
      //         </Button>
      //       </DialogTrigger>
      //       <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      //         <DialogHeader>
      //           <DialogTitle>Schedule Rehearsal</DialogTitle>
      //         </DialogHeader>
      //         <div className="grid gap-4 py-4">
      //           <div className="grid gap-2">
      //             <Label>Title</Label>
      //             <Input
      //               value={title}
      //               onChange={(e) => setTitle(e.target.value)}
      //               placeholder="e.g. Opening Number Practice"
      //             />
      //           </div>

      //           <div className="grid grid-cols-2 gap-4">
      //             <div className="grid gap-2">
      //               <Label>Date</Label>
      //               <Input
      //                 type="date"
      //                 value={date}
      //                 onChange={(e) => setDate(e.target.value)}
      //               />
      //             </div>
      //             <div className="grid gap-2">
      //               <Label>Venue</Label>
      //               <Input
      //                 value={venue}
      //                 onChange={(e) => setVenue(e.target.value)}
      //                 placeholder="e.g. Auditorium"
      //               />
      //             </div>
      //           </div>

      //           <div className="grid grid-cols-2 gap-4">
      //             <div className="grid gap-2">
      //               <Label>Start Time</Label>
      //               <Input
      //                 type="time"
      //                 value={startTime}
      //                 onChange={(e) => setStartTime(e.target.value)}
      //               />
      //             </div>
      //             <div className="grid gap-2">
      //               <Label>End Time</Label>
      //               <Input
      //                 type="time"
      //                 value={endTime}
      //                 onChange={(e) => setEndTime(e.target.value)}
      //               />
      //             </div>
      //           </div>

      //           <div className="grid gap-2">
      //             <Label>Rehearsal Type</Label>
      //             <Select
      //               value={rehearsalType}
      //               onValueChange={(val) => {
      //                 setRehearsalType(val);
      //                 // Reset pair if switching away
      //                 if (val !== "pair") {
      //                   setPair1("");
      //                   setPair2("");
      //                 }
      //               }}
      //             >
      //               <SelectTrigger>
      //                 <SelectValue placeholder="Select type" />
      //               </SelectTrigger>
      //               <SelectContent>
      //                 <SelectItem value="general">
      //                   General (Open to All)
      //                 </SelectItem>
      //                 <SelectItem value="pair">Pair / Duet</SelectItem>
      //                 <SelectItem value="sectional">
      //                   Sectional / Group
      //                 </SelectItem>
      //               </SelectContent>
      //             </Select>
      //           </div>

      //           {rehearsalType === "pair" && (
      //             <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-dashed">
      //               <div className="grid gap-2">
      //                 <Label className="text-xs">Partner 1</Label>
      //                 <Select value={pair1} onValueChange={setPair1}>
      //                   <SelectTrigger className="h-8 text-xs">
      //                     <SelectValue placeholder="Select Partner" />
      //                   </SelectTrigger>
      //                   <SelectContent>
      //                     {members.map((m) => (
      //                       <SelectItem key={m.id} value={m.id}>
      //                         {m.full_name}
      //                       </SelectItem>
      //                     ))}
      //                   </SelectContent>
      //                 </Select>
      //               </div>
      //               <div className="grid gap-2">
      //                 <Label className="text-xs">Partner 2</Label>
      //                 <Select value={pair2} onValueChange={setPair2}>
      //                   <SelectTrigger className="h-8 text-xs">
      //                     <SelectValue placeholder="Select Partner" />
      //                   </SelectTrigger>
      //                   <SelectContent>
      //                     {members.map((m) => (
      //                       <SelectItem key={m.id} value={m.id}>
      //                         {m.full_name}
      //                       </SelectItem>
      //                     ))}
      //                   </SelectContent>
      //                 </Select>
      //               </div>
      //             </div>
      //           )}

      //           <div className="grid gap-2">
      //             <Label>Linked Performance (Optional)</Label>
      //             <Select
      //               value={performanceId}
      //               onValueChange={setPerformanceId}
      //             >
      //               <SelectTrigger>
      //                 <SelectValue placeholder="General Session" />
      //               </SelectTrigger>
      //               <SelectContent>
      //                 <SelectItem value="general">None (General)</SelectItem>
      //                 {performances.map((p) => (
      //                   <SelectItem key={p.id} value={p.id}>
      //                     {p.title}
      //                   </SelectItem>
      //                 ))}
      //               </SelectContent>
      //             </Select>
      //           </div>

      //           <div className="grid gap-2">
      //             <Label>Goal / Description</Label>
      //             <Textarea
      //               value={description}
      //               onChange={(e) => setDescription(e.target.value)}
      //               placeholder="What do we need to achieve?"
      //             />
      //           </div>
      //         </div>
      //         <DialogFooter>
      //           <Button
      //             variant="outline"
      //             onClick={() => setIsDialogOpen(false)}
      //           >
      //             Cancel
      //           </Button>
      //           <Button onClick={handleCreate} disabled={isSubmitting}>
      //             {isSubmitting && (
      //               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      //             )}
      //             Schedule
      //           </Button>
      //         </DialogFooter>
      //       </DialogContent>
      //     </Dialog>
      //   )
      // }
    >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRehearsals.map((rehearsal) => (
            <RehearsalCard
              key={rehearsal.id}
              rehearsal={rehearsal}
              farewellId={farewellId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              // onDuplicate not implemented in page yet, can leave undefined
            />
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
