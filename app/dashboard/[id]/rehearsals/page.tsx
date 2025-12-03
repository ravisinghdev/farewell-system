"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar, Clock, MapPin } from "lucide-react";
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
import { toast } from "sonner";
import {
  getRehearsalsAction,
  createRehearsalAction,
  deleteRehearsalAction,
} from "@/app/actions/event-actions";
import { format } from "date-fns";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [notes, setNotes] = useState("");

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

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const result = await createRehearsalAction(farewellId, {
      title,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      venue,
      notes,
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

  function resetForm() {
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setVenue("");
    setNotes("");
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Rehearsal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title / Activity</Label>
                  <Input
                    placeholder="e.g. Dance Practice - Group A"
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
                      placeholder="e.g. Auditorium"
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
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
            <Card key={rehearsal.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{rehearsal.title}</CardTitle>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rehearsal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(rehearsal.start_time), "EEE, MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(rehearsal.start_time), "h:mm a")} -{" "}
                    {format(new Date(rehearsal.end_time), "h:mm a")}
                  </span>
                </div>
                {rehearsal.venue && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{rehearsal.venue}</span>
                  </div>
                )}
                {rehearsal.notes && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                    {rehearsal.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
