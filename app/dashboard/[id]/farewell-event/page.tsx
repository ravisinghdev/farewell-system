"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MapPin,
  Clock,
  Edit,
  Plus,
  Trash2,
  Sparkles,
  Users,
  Music,
  ListTodo,
  ArrowRight,
  Timer,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
  getPerformancesAction,
  getRehearsalsAction,
} from "@/app/actions/event-actions";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  isPast,
} from "date-fns";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

// Countdown Hook
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (isPast(targetDate)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = differenceInDays(targetDate, now);
      const hours = differenceInHours(targetDate, now) % 24;
      const minutes = differenceInMinutes(targetDate, now) % 60;
      const seconds = differenceInSeconds(targetDate, now) % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function FreshFarewellEventPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [eventDetails, setEventDetails] = useState<any>(null);
  const [farewellSettings, setFarewellSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    performances: 0,
    rehearsals: 0,
    approvedPerformances: 0,
  });
  const [performances, setPerformances] = useState<any[]>([]);

  // Form State
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [agenda, setAgenda] = useState<
    { time: string; activity: string; description: string }[]
  >([]);

  // Use settings.general.event_date as primary source
  const eventDate = useMemo(() => {
    // Priority: farewellSettings.general.event_date > eventDetails.event_date
    const settingsDate = farewellSettings?.general?.event_date;
    if (settingsDate) {
      return new Date(settingsDate);
    }

    if (!eventDetails?.event_date) return null;
    const d = new Date(eventDetails.event_date);
    if (eventDetails?.event_time) {
      const [h, m] = eventDetails.event_time.split(":");
      d.setHours(parseInt(h), parseInt(m));
    }
    return d;
  }, [farewellSettings, eventDetails]);

  const countdown = useCountdown(eventDate);
  const isEventPast = eventDate ? isPast(eventDate) : false;

  useEffect(() => {
    fetchAllData();
  }, [farewellId]);

  async function fetchAllData() {
    setLoading(true);

    // Fetch farewell settings from database
    const supabase = createClient();
    const { data: farewellData } = await supabase
      .from("farewells")
      .select("settings")
      .eq("id", farewellId)
      .single();

    if (farewellData?.settings) {
      setFarewellSettings(farewellData.settings);
    }

    const [detailsData, perfData, rehearsalData] = await Promise.all([
      getEventDetailsAction(farewellId),
      getPerformancesAction(farewellId),
      getRehearsalsAction(farewellId),
    ]);

    if (detailsData) {
      setEventDetails(detailsData);
      setDate(detailsData.event_date || "");
      setTime(detailsData.event_time || "");
      setVenue(detailsData.venue || "");
      setAgenda(detailsData.agenda || []);
    }

    const performances = perfData.data || [];
    const rehearsals = rehearsalData || [];

    // Store performances for the schedule display
    setPerformances(performances);

    setStats({
      performances: performances.length,
      rehearsals: rehearsals.length,
      approvedPerformances: performances.filter(
        (p: any) => p.status === "approved"
      ).length,
    });

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
      toast.error("Error", { description: result.error });
    } else {
      toast.success("Success", { description: "Event details updated!" });
      setIsDialogOpen(false);
      fetchAllData();
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
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <PageScaffold title="Main Farewell Event" description="Loading...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title="Main Farewell Event"
      description="Your command center for the big day."
      action={
        isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="w-4 h-4 mr-2" /> Edit Event
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
                          className="text-destructive"
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
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-900 dark:from-slate-900 dark:via-zinc-900 dark:to-black mb-6 shadow-lg">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="relative z-10 p-5 md:p-8 text-white">
          <div className="flex flex-col gap-4">
            <div>
              <Badge
                variant="outline"
                className="mb-2 bg-white/20 backdrop-blur border-white/30 text-white text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" /> Main Event
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-white">
                {farewell?.name || "Farewell 2026"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {eventDate
                    ? format(eventDate, "EEE, MMM d, yyyy")
                    : "Date TBA"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {eventDate
                    ? format(eventDate, "h:mm a")
                    : eventDetails?.event_time || "Time TBA"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {eventDetails?.venue || "Venue TBA"}
                </span>
              </div>
            </div>

            {/* Countdown */}
            {eventDate && !isEventPast && (
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Days", value: countdown.days },
                  { label: "Hrs", value: countdown.hours },
                  { label: "Min", value: countdown.minutes },
                  { label: "Sec", value: countdown.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center bg-white/15 backdrop-blur rounded-lg px-3 py-2 border border-white/20 min-w-[55px]"
                  >
                    <div className="text-xl md:text-2xl font-bold tabular-nums text-white">
                      {item.value}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-white/60">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isEventPast && (
              <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1.5 backdrop-blur w-fit">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Event Completed!
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Music className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.performances}</p>
              <p className="text-[11px] text-muted-foreground">Performances</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.approvedPerformances}</p>
              <p className="text-[11px] text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Timer className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.rehearsals}</p>
              <p className="text-[11px] text-muted-foreground">Rehearsals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-500/10">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {farewell?.members?.length || 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Team</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - All Events & Planning */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <Button
          variant="outline"
          className="h-auto py-2.5 flex-col gap-0.5"
          asChild
        >
          <Link href={`/dashboard/${farewellId}/rehearsals`}>
            <Timer className="w-4 h-4" />
            <span className="text-[9px]">Rehearsals</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2.5 flex-col gap-0.5"
          asChild
        >
          <Link href={`/dashboard/${farewellId}/tasks`}>
            <ListTodo className="w-4 h-4" />
            <span className="text-[9px]">Tasks</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2.5 flex-col gap-0.5"
          asChild
        >
          <Link href={`/dashboard/${farewellId}/decor`}>
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px]">Decor</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2.5 flex-col gap-0.5"
          asChild
        >
          <Link href={`/dashboard/${farewellId}/performances`}>
            <Music className="w-4 h-4" />
            <span className="text-[9px]">Performances</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-2.5 flex-col gap-0.5"
          asChild
        >
          <Link href={`/dashboard/${farewellId}/timeline`}>
            <Calendar className="w-4 h-4" />
            <span className="text-[9px]">Timeline</span>
          </Link>
        </Button>
      </div>

      {/* Event Schedule - Shows Approved Performances */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Event Schedule</h2>

        {/* Info Banner - Editing Disabled */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 rounded-lg mb-4 flex items-center gap-2">
          <Music className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
              Auto-Generated from Performances
            </h4>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1">
              The schedule is automatically built from approved performances. To
              add or modify items, go to{" "}
              <Link
                href={`/dashboard/${farewellId}/performances`}
                className="underline underline-offset-2 hover:text-amber-900 font-medium"
              >
                Performances
              </Link>{" "}
              and approve acts.
            </p>
          </div>
        </div>

        {performances.filter((p: any) => p.status === "approved").length ===
        0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">
                No Approved Performances
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Approve performances to automatically populate the event
                schedule.
              </p>
              <Button asChild>
                <Link href={`/dashboard/${farewellId}/performances`}>
                  <Music className="w-4 h-4 mr-2" /> Go to Performances
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-4">
              {performances
                .filter((p: any) => p.status === "approved")
                .sort(
                  (a: any, b: any) =>
                    (a.sequence_order || 999) - (b.sequence_order || 999)
                )
                .map((perf: any, index: number) => (
                  <div key={perf.id} className="relative flex gap-4 group">
                    {/* Timeline Dot */}
                    <div className="relative z-10 w-20 flex-shrink-0 text-right">
                      <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Content Card */}
                    <Card className="flex-1 transition-all hover:shadow-md hover:border-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {perf.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {perf.type?.replace("_", " ")}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {Math.floor(
                                  (perf.duration_seconds || 0) / 60
                                )}m {(perf.duration_seconds || 0) % 60}s
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              perf.risk_level === "high"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : perf.risk_level === "medium"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-green-100 text-green-700 border-green-200"
                            )}
                          >
                            {perf.risk_level} risk
                          </Badge>
                        </div>
                        {perf.description && (
                          <p className="text-muted-foreground text-sm mt-2">
                            {perf.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
