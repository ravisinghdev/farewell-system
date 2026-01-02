"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  TaskWithDetails,
  updateTaskStatusAction,
} from "@/app/actions/task-actions";
import { TaskKanbanColumn } from "./task-kanban-column";
import { TaskCard } from "./task-card";
import { TaskDetailsSheet } from "./task-details-sheet";
import { CreateTaskDialog } from "./create-task-dialog"; // Reuse existing dialog logic if possible or wrap it
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CircleDashed,
  Loader2,
  CheckCircle2,
  CircleDot,
  Search,
  Filter,
} from "lucide-react";
import { Database } from "@/types/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskKanbanBoardProps {
  initialTasks: TaskWithDetails[];
  farewellId: string;
  currentUserId?: string;
}

export function TaskKanbanBoard({
  initialTasks,
  farewellId,
  currentUserId,
}: TaskKanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("tasks-board-realtime")
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, searchQuery]);

  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, TaskWithDetails[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    filteredTasks.forEach((t) => {
      // Map any legacy statuses if they exist
      const status = (
        ["todo", "in_progress", "done"].includes(t.status) ? t.status : "todo"
      ) as TaskStatus;

      if (groups[status]) groups[status].push(t);
    });
    return groups;
  }, [filteredTasks]);

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
    const columns: TaskStatus[] = ["todo", "in_progress", "done"];

    if (columns.includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && activeTask && activeTask.status !== targetStatus) {
      const oldStatus = activeTask.status;

      // Optimistic Update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus! } : t
        )
      );

      try {
        const result = await updateTaskStatusAction(
          activeId,
          farewellId,
          targetStatus
        );
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success(`Task moved to ${targetStatus.replace("_", " ")}`);
      } catch (e) {
        toast.error("Failed to update task status");
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, status: oldStatus } : t))
        );
      }
    }
    setActiveTask(null);
  };

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  // Create dialog controls - we might need to invoke a dialog from the column's + button.
  // Ideally, CreateTaskDialog should be openable via prop or context.
  // For now, let's keep it simple: The column + button could just open the standard CreateTaskDialog.
  // But CreateTaskDialog is typically a trigger button.
  // We can wrap it or hack it.

  // Implementation note: We'll stick to basic board logic first.

  return (
    <div className="flex flex-col h-full gap-6 relative">
      {/* HUD Header */}
      <div className="flex items-center justify-between gap-4 bg-background/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />

        <div className="relative flex-1 max-w-md ml-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-cyan-500 animate-pulse" />
          <Input
            placeholder="SEARCH DATABASE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-black/20 border-white/10 shadow-inner focus-visible:ring-1 focus-visible:ring-cyan-500 font-mono text-sm tracking-wide text-cyan-100 placeholder:text-cyan-900/50 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 mr-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 bg-black/20 border-white/10 text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400 font-mono tracking-wider text-xs uppercase"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter Protocol
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="flex h-full gap-6 items-start px-2 min-w-max pb-8 pt-2">
            <TaskKanbanColumn
              id="todo"
              title="BACKLOG"
              tasks={tasksByStatus.todo}
              icon={<CircleDashed className="w-4 h-4" />}
              onTaskClick={setSelectedTaskId}
            />
            <TaskKanbanColumn
              id="in_progress"
              title="ACTIVE"
              tasks={tasksByStatus.in_progress}
              icon={<Loader2 className="w-4 h-4" />}
              onTaskClick={setSelectedTaskId}
            />
            <TaskKanbanColumn
              id="done"
              title="ARCHIVED"
              tasks={tasksByStatus.done}
              icon={<CheckCircle2 className="w-4 h-4" />}
              onTaskClick={setSelectedTaskId}
            />
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105 cursor-grabbing drop-shadow-2xl">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailsSheet
        task={selectedTask}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        farewellId={farewellId}
      />
    </div>
  );
}
