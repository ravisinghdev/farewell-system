"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions/task-actions";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { TaskWithDetails } from "@/app/actions/task-actions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FreshTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farewellId: string;
  taskToEdit?: TaskWithDetails | null;
  onSuccess?: () => void;
}

export function FreshTaskDialog({
  open,
  onOpenChange,
  farewellId,
  taskToEdit,
  onSuccess,
}: FreshTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<
    "planned" | "in_progress" | "waiting" | "completed"
  >("planned");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<Database["public"]["Enums"]["task_priority"]>("medium");
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setStatus(taskToEdit.status as any);
        setDescription(taskToEdit.description || "");
        setPriority(taskToEdit.priority);
        setDate(taskToEdit.due_at ? new Date(taskToEdit.due_at) : undefined);
      } else {
        // Reset for create mode
        setTitle("");
        setStatus("planned");
        setDescription("");
        setPriority("medium");
        setDate(undefined);
      }
    }
  }, [open, taskToEdit]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    try {
      if (taskToEdit) {
        // Update
        const result = await updateTaskAction(taskToEdit.id, farewellId, {
          title,
          status,
          description,
          priority,
          dueAt: date,
        });
        if (result.error) throw new Error(result.error);
        toast.success("Task updated");
      } else {
        // Create
        const result = await createTaskAction(farewellId, {
          title,
          status,
          description,
          priority,
          dueAt: date,
        });
        if (result.error) throw new Error(result.error);
        toast.success("Task created");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setDeleting(true);
    try {
      const result = await deleteTaskAction(taskToEdit.id, farewellId);
      if (result.error) throw new Error(result.error);
      toast.success("Task deleted");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const isEditing = !!taskToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/80 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Task Name</Label>
            <Input
              id="title"
              placeholder="e.g. Design Homepage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl bg-secondary/50 border-white/5 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="rounded-xl bg-secondary/50 border-white/5">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-popover/95 backdrop-blur-lg">
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v: any) => setPriority(v)}
              >
                <SelectTrigger className="rounded-xl bg-secondary/50 border-white/5">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-popover/95 backdrop-blur-lg">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl bg-secondary/50 border-white/5 min-h-[100px] focus-visible:ring-primary"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl bg-secondary/50 border-white/5 hover:bg-white/5",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP p") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (!newDate) {
                      setDate(undefined);
                      return;
                    }
                    // Preserve time if existing date, else default to current time or 12:00
                    const timeSource = date || new Date();
                    if (!date) {
                      // Default to 12:00 PM if picking fresh date
                      newDate.setHours(12, 0, 0, 0);
                    } else {
                      newDate.setHours(
                        timeSource.getHours(),
                        timeSource.getMinutes()
                      );
                    }
                    setDate(newDate);
                  }}
                  initialFocus
                />
                <div className="p-3 border-t border-border">
                  <Input
                    type="time"
                    value={date ? format(date, "HH:mm") : ""}
                    onChange={(e) => {
                      if (!date) return;
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      const newDate = new Date(date);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setDate(newDate);
                    }}
                    className="bg-background/50 border-white/10"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          {isEditing ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
