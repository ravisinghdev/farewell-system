"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit3,
  Play,
  CheckCircle2,
  Copy,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  updateRehearsalDetailsAction,
  duplicateRehearsalAction,
  deleteRehearsalAction,
} from "@/app/actions/rehearsal-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RehearsalOverviewTabProps {
  rehearsal: any;
  farewellId: string;
  isAdmin: boolean;
  participantsCount: number;
}

export function RehearsalOverviewTab({
  rehearsal,
  farewellId,
  isAdmin,
  participantsCount,
}: RehearsalOverviewTabProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    title: rehearsal.title,
    goal: rehearsal.goal || "",
    venue: rehearsal.venue || "",
    start_time: rehearsal.start_time,
    end_time: rehearsal.end_time,
    status: rehearsal.status || "scheduled",
  });

  const durationMinutes =
    (new Date(rehearsal.end_time).getTime() -
      new Date(rehearsal.start_time).getTime()) /
    60000;

  async function handleUpdate() {
    const res = await updateRehearsalDetailsAction(
      rehearsal.id,
      farewellId,
      formData
    );
    if (res.success) {
      toast.success("Rehearsal updated successfully");
      setIsEditing(false);
    } else {
      toast.error(res.error || "Failed to update");
    }
  }

  async function handleDuplicate() {
    setIsDuplicating(true);
    // Duplicate to tomorrow same time
    const tomorrow = new Date(rehearsal.start_time);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await duplicateRehearsalAction(
      rehearsal.id,
      farewellId,
      tomorrow.toISOString()
    );
    setIsDuplicating(false);
    if (res.success) {
      toast.success("Rehearsal duplicated to tomorrow!");
    } else {
      toast.error(res.error || "Failed to duplicate");
    }
  }

  async function handleDelete() {
    const res = await deleteRehearsalAction(rehearsal.id, farewellId);
    if (res.success) {
      toast.success("Rehearsal deleted");
      router.push(`/dashboard/${farewellId}/rehearsals`);
    } else {
      toast.error(res.error || "Failed to delete");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* 1. Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={
                    rehearsal.status === "ongoing" ? "destructive" : "secondary"
                  }
                >
                  {rehearsal.status === "ongoing" && (
                    <span className="animate-pulse mr-1.5 inline-block w-2 h-2 rounded-full bg-current" />
                  )}
                  {rehearsal.status || "Scheduled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/20 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Date & Time
              </p>
              <p className="font-medium mt-1 truncate">
                {format(new Date(rehearsal.start_time), "EEE, MMM d")}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(rehearsal.start_time), "h:mm a")} -{" "}
                {format(new Date(rehearsal.end_time), "h:mm a")}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/20 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Venue
              </p>
              <p
                className="font-medium mt-1 truncate max-w-[120px]"
                title={rehearsal.venue}
              >
                {rehearsal.venue || "TBD"}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(durationMinutes)} mins
              </p>
            </div>
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/20 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Cast & Crew
              </p>
              <p className="font-medium mt-1">{participantsCount} Members</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Main Details & Edit */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">
                Session Details
              </CardTitle>
              {isAdmin && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Rehearsal</DialogTitle>
                      <DialogDescription>
                        Update the key details for this session. Use the status
                        to control live mode.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Start Time</Label>
                          <Input
                            type="datetime-local"
                            value={
                              formData.start_time
                                ? new Date(formData.start_time)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                start_time: new Date(
                                  e.target.value
                                ).toISOString(),
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>End Time</Label>
                          <Input
                            type="datetime-local"
                            value={
                              formData.end_time
                                ? new Date(formData.end_time)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                end_time: new Date(
                                  e.target.value
                                ).toISOString(),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Venue</Label>
                          <Input
                            value={formData.venue}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                venue: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(val) =>
                              setFormData({ ...formData, status: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">
                                Scheduled
                              </SelectItem>
                              <SelectItem value="ongoing">
                                Live / Ongoing
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Goal / Objective</Label>
                        <Textarea
                          value={formData.goal}
                          onChange={(e) =>
                            setFormData({ ...formData, goal: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Goal
                </h4>
                <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-muted-foreground/20 text-sm leading-relaxed">
                  {rehearsal.goal || (
                    <span className="text-muted-foreground italic">
                      No specific goal set. Click edit to add one.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Linked Performance
                </h4>
                {rehearsal.performance ? (
                  <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/20">
                    <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {rehearsal.performance.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Main Event Performance
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-xs"
                      onClick={() =>
                        router.push(
                          `/dashboard/${farewellId}/performances/${rehearsal.performance.id}`
                        )
                      }
                    >
                      View
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    This is a general rehearsal (not linked to a specific
                    performance).
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Quick Actions & Danger Zone */}
        <div className="space-y-6">
          <Card className="bg-muted/10 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={handleDuplicate}
                disabled={isDuplicating || !isAdmin}
              >
                <Copy className="w-4 h-4" />
                {isDuplicating ? "Duplicating..." : "Duplicate Session"}
              </Button>
              <div className="text-xs text-muted-foreground px-1">
                Creates a copy of this session for tomorrow at the same time.
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Delete Rehearsal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete the rehearsal session and all associated
                        attendance records.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleting(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        Confirm Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
