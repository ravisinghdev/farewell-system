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
import { arrayMove } from "@dnd-kit/sortable";
import {
  TaskWithDetails,
  updateTaskStatusAction,
} from "@/app/actions/task-actions";
import { BoardColumn } from "./board-column";
import { TaskCard } from "./task-card";
import { TaskDetailsSheet } from "./task-details-sheet";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleDashed, Loader2, CheckCircle2, CircleDot } from "lucide-react";
import { Database } from "@/types/supabase";
import { cn } from "@/lib/utils";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface TaskBoardProps {
  initialTasks: TaskWithDetails[];
  farewellId: string;
  currentUserId?: string;
}

export function TaskBoard({
  initialTasks,
  farewellId,
  currentUserId,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "mine">("all");
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Sync initial tasks when they change (e.g. server revalidation)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("tasks-board-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "tasks",
          filter: `farewell_id=eq.${farewellId}`,
        },
        (_payload) => {
          // Simplest approach: refresh server data
          // Optimisation: We could handle payload to update state locally
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, router]);

  const filteredTasks = useMemo(() => {
    if (filterMode === "mine" && currentUserId) {
      return tasks.filter((t) =>
        t.assignees.some((a) => a.user_id === currentUserId)
      );
    }
    return tasks;
  }, [tasks, filterMode, currentUserId]);

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
    // The over id could be a column id (e.g. "planned") or another task id
    // We configured BoardColumn to accept drops
    // But SortableContext inside Column also makes items droppable targets? No, usually droppable container.
    // In our BoardColumn, we used `useDroppable({ id: columnId })`.
    // So if we drop on the column directly, over.id is columnId.
    // If we drop on a task, over.data.current.sortable.containerId should be the columnId.

    let targetStatus: TaskStatus | null = null;

    // Check if dropped on a column directly
    const columns: TaskStatus[] = ["todo", "in_progress", "done"];
    if (columns.includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task?
      // We need to find which column that task belongs to.
      // Or drag-kit logic
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && activeTask && activeTask.status !== targetStatus) {
      // Optimistic Update
      const oldStatus = activeTask.status;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus! } : t
        )
      );

      // Server Action
      try {
        const result = await updateTaskStatusAction(
          activeId,
          farewellId,
          targetStatus
        );
        if (result.error) {
          // Revert
          toast.error("Failed to move task: " + result.error);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === activeId ? { ...t, status: oldStatus } : t
            )
          );
        }
      } catch (e) {
        toast.error("Network error");
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, status: oldStatus } : t))
        );
      }
    }

    setActiveTask(null);
  };

  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, TaskWithDetails[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    tasks.forEach((t) => {
      // Map legacy statuses if any exist in DB to valid keys
      const safeStatus = (
        ["todo", "in_progress", "done"].includes(t.status) ? t.status : "todo"
      ) as TaskStatus;

      if (groups[safeStatus]) groups[safeStatus].push(t);
    });
    return groups;
  }, [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4 items-start md:snap-none snap-x snap-mandatory px-4 md:px-0 scroll-smooth">
          <div className="min-w-[85vw] md:min-w-[320px] snap-center h-full">
            <BoardColumn
              id="todo"
              title="To Do"
              tasks={tasksByStatus.todo}
              icon={<CircleDashed className="w-4 h-4 text-slate-500" />}
              onTaskClick={setSelectedTaskId}
            />
          </div>
          <div className="min-w-[85vw] md:min-w-[320px] snap-center h-full">
            <BoardColumn
              id="in_progress"
              title="In Progress"
              tasks={tasksByStatus.in_progress}
              icon={
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin-slow" />
              }
              onTaskClick={setSelectedTaskId}
            />
          </div>
          <div className="min-w-[85vw] md:min-w-[320px] snap-center h-full">
            <BoardColumn
              id="done"
              title="Done"
              tasks={tasksByStatus.done}
              icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
              onTaskClick={setSelectedTaskId}
            />
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailsSheet
        task={selectedTask}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        farewellId={farewellId}
      />
    </>
  );
}
