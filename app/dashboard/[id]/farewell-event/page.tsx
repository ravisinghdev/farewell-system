"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Edit, Plus, Trash2 } from "lucide-react";
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
  getEventDetailsAction,
  updateEventDetailsAction,
} from "@/app/actions/event-actions";
import { format } from "date-fns";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";

export default function FarewellEventPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [agenda, setAgenda] = useState<
    { time: string; activity: string; description: string }[]
  >([]);

  useEffect(() => {
    fetchDetails();
  }, [farewellId]);

  async function fetchDetails() {
    setLoading(true);
    const data = await getEventDetailsAction(farewellId);
    if (data) {
      setEventDetails(data);
      setDate(data.event_date || "");
      setTime(data.event_time || "");
      setVenue(data.venue || "");
      setAgenda(data.agenda || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    const result = await updateEventDetailsAction(farewellId, {
      event_date: date,
      event_time: time,
      venue,
      agenda,
    });

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Event details updated successfully",
      });
      setIsDialogOpen(false);
      fetchDetails();
    }
  }

  const addAgendaItem = () => {
    setAgenda([...agenda, { time: "", activity: "", description: "" }]);
  };

  const updateAgendaItem = (index: number, field: string, value: string) => {
    const newAgenda = [...agenda];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    setAgenda(newAgenda);
  };

  const removeAgendaItem = (index: number) => {
    const newAgenda = agenda.filter((_, i) => i !== index);
    setAgenda(newAgenda);
  };

  return (
    <PageScaffold
      title="Main Farewell Event"
      description="Schedule, venue details, and main event coordination."
      action={
        isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="w-4 h-4 mr-2" /> Edit Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Event Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Time</Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Agenda / Timeline</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAgendaItem}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </div>
                  {agenda.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md bg-muted/20"
                    >
                      <div className="col-span-3">
                        <Input
                          placeholder="Time"
                          value={item.time}
                          onChange={(e) =>
                            updateAgendaItem(index, "time", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-8 space-y-2">
                        <Input
                          placeholder="Activity Title"
                          value={item.activity}
                          onChange={(e) =>
                            updateAgendaItem(index, "activity", e.target.value)
                          }
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          className="h-16 text-xs"
                          value={item.description}
                          onChange={(e) =>
                            updateAgendaItem(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => removeAgendaItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-lg font-bold">
                {eventDetails?.event_date
                  ? format(new Date(eventDetails.event_date), "MMMM d, yyyy")
                  : "To Be Announced"}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <p className="text-lg font-bold">
                {eventDetails?.event_time || "TBA"}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Venue</p>
              <p className="text-lg font-bold">
                {eventDetails?.venue || "To Be Announced"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Event Schedule</h3>
        {!eventDetails?.agenda || eventDetails.agenda.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
            No schedule items added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {eventDetails.agenda.map((item: any, index: number) => (
              <div
                key={index}
                className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="w-24 flex-shrink-0 font-mono font-bold text-primary pt-1">
                  {item.time}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{item.activity}</h4>
                  {item.description && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
