"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { createTaskAction } from "@/app/actions/task-actions";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

interface CreateTaskDialogProps {
  farewellId: string;
}

export function CreateTaskDialog({ farewellId }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Minimal form state
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");

  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<Database["public"]["Enums"]["task_priority"]>("medium");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DDT...

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    const result = await createTaskAction(farewellId, {
      title,
      status,
      description: isExpanded ? description : undefined,
      priority: isExpanded ? priority : "medium",
      dueAt: isExpanded && date ? new Date(date) : undefined,
      // assigneeIds: [] // Add multi-select user picker later
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Task created");
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setStatus("todo");
    setDescription("");
    setPriority("medium");
    setDate("");
    setIsExpanded(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-sm shadow-blue-200">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white text-slate-900 border-slate-200 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-slate-600 font-medium">
              Task Name
            </Label>
            <Input
              id="title"
              placeholder="e.g. Design Homepage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-slate-600 font-medium">
                Status
              </Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isExpanded && (
              <div className="grid gap-2">
                <Label
                  htmlFor="priority"
                  className="text-slate-600 font-medium"
                >
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v: any) => setPriority(v)}
                >
                  <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isExpanded ? (
            <>
              <div className="grid gap-2">
                <Label
                  htmlFor="description"
                  className="text-slate-600 font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Details about this task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50 min-h-[100px] focus-visible:ring-blue-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date" className="text-slate-600 font-medium">
                  Deadline
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              className="justify-start px-0 text-blue-600 hover:text-blue-700 hover:bg-transparent font-medium"
              onClick={() => setIsExpanded(true)}
            >
              + Add more details
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
