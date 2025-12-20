"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
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
  createRehearsalAction,
  deleteRehearsalAction,
  duplicateRehearsalAction,
} from "@/app/actions/rehearsal-actions";
// Note: We switched to rehearsal-actions.ts
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { RehearsalCard } from "@/components/rehearsals/rehearsal-card";

export default function RehearsalsPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("general");

  useEffect(() => {
    fetchRehearsals();
  }, [farewellId]);

  async function fetchRehearsals() {
    setLoading(true);
    const data = await getRehearsalsAction(farewellId);
    setRehearsals(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!title || !date || !startTime || !endTime) {
      toast.error("Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    // Combine date and time
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const result = await createRehearsalAction(farewellId, {
      title,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      venue,
      description,
      rehearsal_type: type,
    });

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Rehearsal scheduled successfully",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchRehearsals();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this rehearsal?")) return;
    const result = await deleteRehearsalAction(id, farewellId);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Rehearsal deleted",
      });
      fetchRehearsals();
    }
  }

  async function handleDuplicate(id: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    toast.info("Duplicating rehearsal...");
    const result = await duplicateRehearsalAction(id, farewellId, dateStr);

    if (result.error) {
      toast.error("Error duplicating", { description: result.error });
    } else {
      toast.success("Rehearsal duplicated successfully", {
        description: "You can now edit the new rehearsal.",
      });
      fetchRehearsals();
    }
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setVenue("");
    setDescription("");
    setType("general");
  }

  return (
    <PageScaffold
      title="Rehearsals & Planning"
      description="Schedule and manage practice sessions for the event."
      action={
        isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Schedule Rehearsal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule New Rehearsal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label className="col-span-1">Activity</Label>
                  <Input
                    className="col-span-3"
                    placeholder="e.g. Final Dance Practice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label className="col-span-1">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="dance">Dance Practice</SelectItem>
                      <SelectItem value="music">Music/Choir</SelectItem>
                      <SelectItem value="skit">Skit/Drama</SelectItem>
                      <SelectItem value="anchor">Anchoring</SelectItem>
                      <SelectItem value="technical">Technical Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label className="col-span-1">Date</Label>
                  <Input
                    type="date"
                    className="col-span-3"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
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
                  <Label>Venue</Label>
                  <Input
                    placeholder="e.g. School Auditorium"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes / Description</Label>
                  <Textarea
                    placeholder="Instructions for participants..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Schedule</Button>
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
          <h3 className="text-lg font-medium">No Rehearsals Scheduled</h3>
          <p className="text-muted-foreground mt-1">
            Get started by scheduling the first practice session.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rehearsals.map((rehearsal) => (
            <RehearsalCard
              key={rehearsal.id}
              rehearsal={rehearsal}
              farewellId={farewellId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
