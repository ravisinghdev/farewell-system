"use client";

import { useEffect, useState, useMemo, useId } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  TaskWithDetails,
  updateTaskStatusAction,
} from "@/app/actions/task-actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Circle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  MoreHorizontal,
  Filter,
  Users,
  CalendarDays,
} from "lucide-react";
import { Database } from "@/types/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FreshTaskDialog } from "./fresh-task-dialog";

type TaskStatus = Database["public"]["Enums"]["task_status"];

// --- Styled Task Card Component ---
function FreshTaskCard({
  task,
  onClick,
}: {
  task: TaskWithDetails;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.due_at &&
    new Date(task.due_at) < new Date() &&
    task.status !== "completed";

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[120px] rounded-xl bg-primary/5 border-2 border-primary/20 border-dashed opacity-50"
      />
    );
  }

  const priorityConfig = {
    critical: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    high: {
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    medium: {
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    low: {
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  };

  const pConfig =
    priorityConfig[task.priority as keyof typeof priorityConfig] ||
    priorityConfig.low;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={task.id}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative bg-white/5 hover:bg-white/10 dark:bg-black/40 dark:hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-sm transition-all"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 font-medium border-0",
            pConfig.bg,
            pConfig.color
          )}
        >
          {task.priority}
        </Badge>
        {isOverdue && (
          <div className="text-red-400 text-[10px] font-bold flex items-center gap-1 bg-red-400/10 px-1.5 rounded-sm">
            <Clock className="w-3 h-3" /> Due
          </div>
        )}
      </div>

      <h4 className="text-sm font-semibold text-foreground/90 leading-snug mb-3 pr-4">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-2">
          {task.assignees?.map((a) => (
            <Avatar
              key={a.user_id}
              className="w-6 h-6 border-2 border-background"
            >
              <AvatarImage src={a.user.avatar_url || ""} />
              <AvatarFallback className="text-[8px]">
                {a.user.full_name?.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          )) || (
            <span className="text-[10px] text-muted-foreground italic">
              Unassigned
            </span>
          )}
        </div>

        {task.due_at && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {format(new Date(task.due_at), "MMM d")}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Status Column Component ---
function FreshKanbanColumn({
  id,
  title,
  tasks,
  icon: Icon,
  color,
  onTaskClick,
}: {
  id: string;
  title: string;
  tasks: TaskWithDetails[];
  icon: any;
  color: string;
  onTaskClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[300px] w-full max-w-[360px] md:w-[320px]">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 mb-3 rounded-2xl border bg-background/40 backdrop-blur-xl shadow-sm",
          color
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-background/50 backdrop-blur-md shadow-sm">
            <Icon className="w-4 h-4 opacity-80" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            <p className="text-[10px] text-muted-foreground font-medium">
              {tasks.length} Tasks
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-background/50"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-3xl p-2 transition-colors",
          isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-transparent"
        )}
      >
        <ScrollArea className="h-full pr-3 pb-20">
          <div className="space-y-3 pb-4">
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <FreshTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </SortableContext>

            {tasks.length === 0 && (
              <div className="h-32 border-2 border-dashed border-muted/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                <Icon className="w-6 h-6 opacity-20" />
                <span className="text-xs font-medium">No tasks</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// --- Main Board Component ---
interface LocalBoardProps {
  initialTasks: TaskWithDetails[];
  farewellId: string;
  currentUserId?: string;
}

export function FreshTaskBoard({
  initialTasks,
  farewellId,
  currentUserId,
}: LocalBoardProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const dndContextId = useId();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(
    null
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Realtime Sync
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("fresh-tasks-board")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, router]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Filtering
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const tasksByStatus = useMemo(() => {
    const groups: Record<string, TaskWithDetails[]> = {
      planned: [],
      in_progress: [],
      waiting: [],
      completed: [],
    };
    filteredTasks.forEach((t) => {
      // Cast status or fallback
      const status = [
        "planned",
        "in_progress",
        "waiting",
        "completed",
      ].includes(t.status)
        ? t.status
        : "planned";

      if (groups[status]) groups[status].push(t);
    });
    return groups;
  }, [filteredTasks]);

  // DND Handlers
  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task as TaskWithDetails);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id as string;
    let targetStatus: TaskStatus | null = null;
    const columns = ["planned", "in_progress", "waiting", "completed"];

    // Dropped on column
    if (columns.includes(over.id as string)) {
      targetStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus && activeTask && activeTask.status !== targetStatus) {
      const oldStatus = activeTask.status;
      // Optimistic
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus! } : t
        )
      );

      try {
        await updateTaskStatusAction(activeId, farewellId, targetStatus);
      } catch (e) {
        toast.error("Failed to move task");
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, status: oldStatus } : t))
        );
      }
    }
    setActiveTask(null);
  };

  const handleCreateNew = () => {
    console.log("Opening create task dialog");
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  const handleTaskClick = (taskId: string) => {
    console.log("Opening edit task dialog", taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-[1600px] mx-auto">
      {/* Header / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/40 border-white/5 focus:bg-background/60 shadow-sm rounded-xl h-11 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2 mr-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground"
              >
                <Users className="w-3 h-3" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-muted-foreground">
              +5
            </div>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-10 px-6 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Board Area */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <ScrollArea className="flex-1 -mx-4 md:mx-0">
          <div className="flex h-full gap-6 px-4 md:px-0 min-w-max pb-12">
            <FreshKanbanColumn
              id="planned"
              title="Planned"
              tasks={tasksByStatus.planned}
              icon={Circle}
              color="border-slate-500/10 text-slate-500"
              onTaskClick={handleTaskClick}
            />
            <FreshKanbanColumn
              id="in_progress"
              title="In Progress"
              tasks={tasksByStatus.in_progress}
              icon={Clock}
              color="border-blue-500/10 text-blue-500"
              onTaskClick={handleTaskClick}
            />
            <FreshKanbanColumn
              id="waiting"
              title="Waiting"
              tasks={tasksByStatus.waiting}
              icon={MoreHorizontal}
              color="border-orange-500/10 text-orange-500"
              onTaskClick={handleTaskClick}
            />
            <FreshKanbanColumn
              id="completed"
              title="Completed"
              tasks={tasksByStatus.completed}
              icon={CheckCircle2}
              color="border-green-500/10 text-green-500"
              onTaskClick={handleTaskClick}
            />
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90 scale-105">
              <FreshTaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <FreshTaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farewellId={farewellId}
        taskToEdit={selectedTask}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
