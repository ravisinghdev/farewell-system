"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TaskWithDetails,
  updateTaskAction,
  deleteTaskAction,
  addTaskCommentAction,
  updateTaskStatusAction,
  getFarewellMembersAction,
  toggleTaskAssignmentAction,
} from "@/app/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  Trash2,
  Send,
  User,
  CheckCircle2,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskDetailViewProps {
  task: TaskWithDetails;
  farewellId: string;
  currentUser: any;
}

export function TaskDetailView({
  task: initialTask,
  farewellId,
  currentUser,
}: TaskDetailViewProps) {
  const [task, setTask] = useState(initialTask);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const router = useRouter();
  const supabase = createClient();

  // Fetch members for assignment
  useEffect(() => {
    getFarewellMembersAction(farewellId).then(setMembers);
  }, [farewellId]);

  useEffect(() => {
    const channel = supabase
      .channel(`task-detail-${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `id=eq.${task.id}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${task.id}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_activity_log", // Corrected table name
          filter: `task_id=eq.${task.id}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [task.id, router, supabase]);

  // Sync state if initialTask updates from server refresh
  useEffect(() => {
    setTask(initialTask);
    setTitle(initialTask.title);
    setDescription(initialTask.description || "");
  }, [initialTask]);

  const handleUpdateTitle = async () => {
    if (title === task.title) {
      setIsEditingTitle(false);
      return;
    }
    const res = await updateTaskAction(task.id, farewellId, { title });
    if (res.error) toast.error(res.error);
    else setIsEditingTitle(false);
  };

  const handleUpdateDescription = async () => {
    if (description === task.description) return;
    const res = await updateTaskAction(task.id, farewellId, {
      description,
    });
    if (res.error) toast.error(res.error);
  };

  const handleUpdateStatus = async (status: string) => {
    const oldStatus = task.status;
    setTask({ ...task, status: status as any });

    const res = await updateTaskStatusAction(
      task.id,
      farewellId,
      status as any
    );
    if (res.error) {
      setTask({ ...task, status: oldStatus });
      toast.error(res.error);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    const res = await updateTaskAction(task.id, farewellId, {
      priority: priority as any,
    });
    if (res.error) toast.error(res.error);
  };

  const handleSendComment = async () => {
    if (!comment.trim()) return;
    setLoading(true);
    const res = await addTaskCommentAction(task.id, farewellId, comment);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else setComment("");
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this task? This cannot be undone."
      )
    )
      return;
    const res = await deleteTaskAction(task.id, farewellId);
    if (res.error) toast.error(res.error);
    else router.push(`/dashboard/${farewellId}/tasks`);
  };

  const handleToggleAssignee = async (userId: string) => {
    const isAssigned = task.assignees.some((a) => a.user_id === userId);
    // Optimistic update
    const newAssignees = isAssigned
      ? task.assignees.filter((a) => a.user_id !== userId)
      : [
          ...task.assignees,
          {
            user_id: userId,
            user: members.find((m) => m.user_id === userId)?.user || {},
          },
        ];

    setTask({ ...task, assignees: newAssignees as any });

    const res = await toggleTaskAssignmentAction(
      task.id,
      farewellId,
      userId,
      !isAssigned
    );
    if (res.error) {
      toast.error(res.error);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Board
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tasks</span>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {task.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content (Left Col) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Title Section */}
            <div className="space-y-4">
              {isEditingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
                  autoFocus
                  className="text-3xl font-bold h-auto py-2 px-1 border-transparent hover:border-border focus:border-primary transition-all bg-transparent"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-3xl font-bold cursor-text hover:bg-muted/30 rounded px-1 transition-colors text-foreground"
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl border shadow-sm p-6 min-h-[300px]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                Description
              </h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleUpdateDescription}
                placeholder="Add a more detailed description..."
                className="min-h-[200px] text-base resize-none border-none focus-visible:ring-0 bg-transparent p-0 placeholder:text-muted-foreground/50 leading-relaxed"
              />
            </div>

            {/* Activity/Comments */}
            <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Discussion & Activity
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  {task.comments?.length || 0}
                </Badge>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  ...(task.comments || []).map((c) => ({
                    ...c,
                    type: "comment",
                  })),
                  ...(task.activity || []).map((a) => ({ ...a, type: "log" })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  )
                  .map((item: any) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex gap-4",
                        item.type === "log" ? "opacity-60 text-sm" : ""
                      )}
                    >
                      {item.type === "comment" ? (
                        <Avatar className="w-8 h-8 mt-1 border">
                          <AvatarImage
                            src={item.user?.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {item.user?.full_name?.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 mt-1 flex items-center justify-center rounded-full bg-muted">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {item.type === "comment"
                              ? item.user?.full_name
                              : item.actor?.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        {item.type === "comment" ? (
                          <div className="bg-muted/30 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm text-foreground leading-relaxed">
                            {item.content}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Comment Input */}
              <div className="flex gap-4 items-start pt-4 border-t">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage
                    src={currentUser?.user_metadata?.avatar_url || undefined}
                  />
                  <AvatarFallback>
                    {currentUser?.email?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="bg-muted/50 border-transparent focus:bg-background focus:border-primary min-h-[80px] rounded-xl"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSendComment}
                      disabled={loading || !comment.trim()}
                    >
                      Send Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Meta) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status Card */}
            <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase">
                Status & Priority
              </h3>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <Select value={task.status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={task.priority}
                  onValueChange={handleUpdatePriority}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase">
                Details
              </h3>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Due Date</span>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {task.due_at
                    ? format(new Date(task.due_at), "PPP")
                    : "No date"}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Assignees</span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      {members.map((member) => {
                        const isAssigned = task.assignees.some(
                          (a) => a.user_id === member.user_id
                        );
                        return (
                          <DropdownMenuItem
                            key={member.user_id}
                            onClick={() => handleToggleAssignee(member.user_id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Avatar className="w-5 h-5">
                                <AvatarImage
                                  src={member.user.avatar_url || undefined}
                                />
                                <AvatarFallback>
                                  {member.user.full_name?.substring(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 truncate text-xs">
                                {member.user.full_name}
                              </span>
                              {isAssigned && (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2">
                  {task.assignees?.map((a) => (
                    <div
                      key={a.user_id}
                      className="flex items-center gap-2 bg-muted/50 pl-1 pr-3 py-1 rounded-full border"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={a.user.avatar_url || undefined} />
                        <AvatarFallback>
                          {a.user.full_name?.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {a.user.full_name?.split(" ")[0]}
                      </span>
                      <button
                        onClick={() => handleToggleAssignee(a.user_id)}
                        className="text-muted-foreground hover:text-destructive ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(!task.assignees || task.assignees.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">
                      No one assigned
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
