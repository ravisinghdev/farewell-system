"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getEventTasksAction,
  createEventTaskAction,
  updateTaskStatusAction,
  deleteEventTaskAction,
} from "@/app/actions/event-actions";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EventTasksPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    fetchTasks();
  }, [farewellId]);

  async function fetchTasks() {
    setLoading(true);
    const data = await getEventTasksAction(farewellId);
    setTasks(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!title) {
      toast.error("Error", {
        description: "Please enter a task title",
      });
      return;
    }

    const result = await createEventTaskAction(farewellId, {
      title,
      description,
      priority,
    });

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Task created",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchTasks();
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const result = await updateTaskStatusAction(id, farewellId, status);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      fetchTasks();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const result = await deleteEventTaskAction(id, farewellId);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      fetchTasks();
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("medium");
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 border-red-500/20 bg-red-500/10";
      case "low":
        return "text-blue-500 border-blue-500/20 bg-blue-500/10";
      default:
        return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
    }
  };

  // Group tasks by status
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-3 hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex justify-between items-center mt-3 pt-2 border-t">
          <div className="flex items-center gap-1">
            {/* Assigned user avatar could go here */}
          </div>

          <div className="flex gap-1">
            {isAdmin && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(task.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}

            {task.status !== "done" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-green-500 hover:bg-green-500/10"
                onClick={() =>
                  handleStatusUpdate(
                    task.id,
                    task.status === "todo" ? "in_progress" : "done"
                  )
                }
                title="Advance"
              >
                <CheckCircle2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageScaffold
      title="Event Task Board"
      description="Track and manage tasks for the event execution."
      action={
        isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input
                    placeholder="e.g. Arrange Sound System"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    >
      {loading ? (
        <div className="text-center py-10">Loading tasks...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 h-full">
          {/* To Do Column */}
          <div className="bg-muted/10 rounded-xl p-4 border h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">To Do</h3>
              <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
                {todoTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {todoTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {todoTasks.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                  No tasks to do
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-sm text-blue-500">
                In Progress
              </h3>
              <span className="ml-auto bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-xs font-medium">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-blue-500/20 rounded-lg">
                  No active tasks
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/10 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-sm text-green-500">
                Completed
              </h3>
              <span className="ml-auto bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-xs font-medium">
                {doneTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {doneTasks.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-green-500/20 rounded-lg">
                  No completed tasks
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}
