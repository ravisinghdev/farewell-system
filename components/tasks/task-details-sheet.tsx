"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Send,
  Clock,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  getTaskCommentsAction,
  addTaskCommentAction,
  getTaskActivityLogAction,
  TaskWithDetails,
  updateTaskDetailsAction,
} from "@/app/actions/task-actions";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

interface TaskDetailsSheetProps {
  task: TaskWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farewellId: string;
}

export function TaskDetailsSheet({
  task,
  open,
  onOpenChange,
  farewellId,
}: TaskDetailsSheetProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && task) {
      fetchDetails();
    }
  }, [open, task]);

  const fetchDetails = async () => {
    if (!task) return;
    setLoading(true);
    const [c, a] = await Promise.all([
      getTaskCommentsAction(task.id),
      getTaskActivityLogAction(task.id),
    ]);
    setComments(c || []);
    setActivity(a || []);
    setLoading(false);
  };

  const handleSendComment = async () => {
    if (!task || !newComment.trim()) return;
    setSending(true);
    const result = await addTaskCommentAction(task.id, farewellId, newComment);
    if (result.error) {
      toast.error(result.error);
    } else {
      setNewComment("");
      // Optimistic update would be better, but re-fetch for now to get proper user object
      // Actually, let's just re-fetch
      const c = await getTaskCommentsAction(task.id);
      setComments(c || []);
    }
    setSending(false);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 pb-2 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={
                task.status === "done"
                  ? "default"
                  : task.status === "in_progress"
                  ? "secondary"
                  : "outline"
              }
            >
              {task.status.replace("_", " ")}
            </Badge>
            {(task.priority as string) === "critical" && (
              <Badge variant="destructive">Critical</Badge>
            )}
          </div>
          <SheetTitle className="text-xl">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-muted/5">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <div className="px-6 pt-2 bg-background border-b">
              <TabsList className="w-full justify-start h-9 bg-transparent p-0">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2"
                >
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="details"
              className="flex-1 overflow-auto p-6 space-y-6 m-0"
            >
              {/* Due Date & Assignees */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </label>
                  <div className="text-sm font-medium">
                    {task.due_at
                      ? format(new Date(task.due_at), "PPP p")
                      : "No due date"}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Assignees
                  </label>
                  <div className="flex -space-x-2 pt-1">
                    {task.assignees?.map((a) => (
                      <Avatar
                        key={a.user_id}
                        className="w-8 h-8 border-2 border-background"
                      >
                        <AvatarImage src={a.user.avatar_url || ""} />
                        <AvatarFallback>
                          {a.user.full_name?.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(!task.assignees || task.assignees.length === 0) && (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed bg-background p-3 rounded-md border min-h-[100px]">
                  {task.description || "No description provided."}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="comments"
              className="flex-1 flex flex-col m-0 overflow-hidden"
            >
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No comments yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarImage src={comment.user?.avatar_url} />
                          <AvatarFallback>
                            {comment.user?.full_name?.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-background border rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold">
                                {comment.user?.full_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(
                                  new Date(comment.created_at),
                                  "MMM d, h:mm a"
                                )}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 bg-background border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a comment..."
                    className="min-h-[40px] max-h-[120px] resize-none" // Auto-grow would be nice
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    disabled={!newComment.trim() || sending}
                    onClick={handleSendComment}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="activity"
              className="flex-1 overflow-auto p-6 m-0"
            >
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="relative border-l ml-3 space-y-6">
                  {activity.map((log) => (
                    <div key={log.id} className="ml-6 relative">
                      <div className="absolute -left-[31px] bg-background border rounded-full w-2.5 h-2.5 mt-1.5" />
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">
                          {log.actor?.full_name}{" "}
                          <span className="text-muted-foreground font-normal">
                            {log.action_type.replace(/_/g, " ")}
                          </span>
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {format(new Date(log.created_at), "MMM d, p")}
                        </span>
                      </div>
                      {log.metadata && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          {JSON.stringify(log.metadata)}
                          {/* Pretty print metadata later */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
