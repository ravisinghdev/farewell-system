"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  updateDutyAction,
  deleteDutyAction,
} from "@/app/actions/duty-management-actions";
import { assignDutiesAction } from "@/app/actions/duty-actions";
import { getFarewellMembers } from "@/actions/people";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Trash2,
  Save,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DutyManagementPanelProps {
  duty: any;
  farewellId: string;
  onUpdate: () => void;
  onDelete: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function DutyManagementPanel({
  duty,
  farewellId,
  onUpdate,
  onDelete,
}: DutyManagementPanelProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Edit form state
  const [title, setTitle] = useState(duty.title);
  const [description, setDescription] = useState(duty.description || "");
  const [priority, setPriority] = useState(duty.priority || "medium");
  const [deadline, setDeadline] = useState<Date | undefined>(
    duty.deadline ? new Date(duty.deadline) : undefined
  );
  const [budget, setBudget] = useState(duty.expense_limit?.toString() || "");
  const [location, setLocation] = useState(duty.location || "");

  const loadMembers = async () => {
    if (members.length > 0) return;
    setLoadingMembers(true);
    try {
      const data = await getFarewellMembers(farewellId);
      setMembers(data || []);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateDutyAction(duty.id, {
        title,
        description,
        priority,
        deadline: deadline?.toISOString(),
        expense_limit: budget ? parseFloat(budget) : 0,
        location,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Duty updated successfully");
        setEditing(false);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to update duty");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteDutyAction(duty.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Duty deleted");
        onDelete();
      }
    } catch (error) {
      toast.error("Failed to delete duty");
    }
  };

  const handleAssignMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    try {
      const result = await assignDutiesAction(
        farewellId,
        duty.id,
        selectedMembers
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Members assigned successfully");
        setShowAssignDialog(false);
        setSelectedMembers([]);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to assign members");
    }
  };

  const currentAssignees = duty.duty_assignments || [];

  return (
    <div className="space-y-6">
      {/* Current Assignments */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Assigned Members ({currentAssignees.length})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              loadMembers();
              setShowAssignDialog(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Members
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentAssignees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members assigned yet
            </p>
          ) : (
            currentAssignees.map((assignment: any) => (
              <Badge
                key={assignment.id}
                variant="secondary"
                className="px-3 py-1"
              >
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarImage src={assignment.users?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {assignment.users?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {assignment.users?.full_name}
                <Badge className="ml-2 text-xs">{assignment.status}</Badge>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Edit Duty */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Duty Details</h3>
          {!editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Budget Limit</Label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Main Auditorium"
              />
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Priority:</span>{" "}
              <Badge>{priority}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Budget:</span> ₹
              {duty.expense_limit || 0}
            </div>
            {location && (
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {location}
              </div>
            )}
            {deadline && (
              <div>
                <span className="text-muted-foreground">Deadline:</span>{" "}
                {format(deadline, "PPP")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Duty */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting this duty will remove all associated data including receipts,
          subtasks, and comments.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Duty
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                duty and all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Assign Members Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Assign Members</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAssignDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-64 border rounded-lg p-2 mb-4">
              {loadingMembers ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading...
                </div>
              ) : (
                <div className="space-y-1">
                  {members.map((member) => {
                    const isAlreadyAssigned = currentAssignees.some(
                      (a: any) => a.user_id === member.user_id
                    );
                    return (
                      <div
                        key={member.user_id}
                        className={cn(
                          "flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer",
                          isAlreadyAssigned && "opacity-50"
                        )}
                        onClick={() => {
                          if (isAlreadyAssigned) return;
                          setSelectedMembers((prev) =>
                            prev.includes(member.user_id)
                              ? prev.filter((id) => id !== member.user_id)
                              : [...prev, member.user_id]
                          );
                        }}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(member.user_id)}
                          disabled={isAlreadyAssigned}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.users?.avatar_url} />
                          <AvatarFallback>
                            {member.users?.full_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">
                          {member.users?.full_name}
                        </span>
                        {isAlreadyAssigned && (
                          <Badge variant="secondary">Assigned</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Button onClick={handleAssignMembers} className="flex-1">
                Assign ({selectedMembers.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
