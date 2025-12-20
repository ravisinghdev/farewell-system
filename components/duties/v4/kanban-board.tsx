"use client";

import { useState, useEffect } from "react";
import { Duty, updateDutyStatusAction } from "@/app/actions/duty-actions";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GlassDutyCard } from "./glass-duty-card";
import { toast } from "sonner";
import { DutyDetailSheet } from "./duty-detail-sheet";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface KanbanBoardProps {
  initialDuties: Duty[];
  farewellId: string;
  isAdmin?: boolean;
  allMembers?: { id: string; full_name: string; avatar_url: string }[];
  currentUserId: string;
}

type ColumnId = "pending" | "in_progress" | "completed";

const columns: { id: ColumnId; title: string }[] = [
  { id: "pending", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "completed", title: "Done" },
];

export function KanbanBoard({
  initialDuties,
  farewellId,
  isAdmin = false,
  allMembers = [],
  currentUserId,
}: KanbanBoardProps) {
  const [duties, setDuties] = useState<Duty[]>(initialDuties || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setDuties(initialDuties);
  }, [initialDuties]);

  useEffect(() => {
    setMounted(true);

    const channel = supabase
      .channel(`duties-${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duties",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_assignments",
        },
        () => {
          // We might want to filter assignment changes related to duties in this farewell
          // But determining that client-side filter string is complex without join.
          // For now, refreshing on any assignment change is safe but possibly noisy.
          // Optimization: Check if the duty_id belongs to one of our duties (optional)
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_receipts",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase, router]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (!isAdmin) return;
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDuty = duties.find((d) => d.id === activeId);
    if (!activeDuty) return;

    let newStatus: ColumnId | null = null;

    if (columns.some((col) => col.id === overId)) {
      newStatus = overId as ColumnId;
    } else {
      const overDuty = duties.find((d) => d.id === overId);
      if (overDuty) {
        newStatus = overDuty.status as ColumnId;
      }
    }

    if (newStatus && newStatus !== activeDuty.status) {
      const updatedDuties = duties.map((d) =>
        d.id === activeId ? { ...d, status: newStatus! } : d
      );
      setDuties(updatedDuties);

      try {
        const result = await updateDutyStatusAction(
          farewellId,
          activeId,
          newStatus
        );
        if (result && result.error) {
          toast.error("Failed to move item");
          setDuties(duties);
        } else {
          toast.success(`Moved to ${newStatus.replace("_", " ")}`);
        }
      } catch (e) {
        setDuties(duties);
        toast.error("An error occurred");
      }
    }
  };

  if (!mounted) {
    return (
      <>
        <div className="flex justify-end mb-2">
          {isAdmin && (
            <span className="text-xs text-yellow-500 font-mono bg-yellow-500/10 px-2 py-1 rounded">
              Admin Mode
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex flex-col rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 p-4 min-h-[200px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-white/90">
                  {col.title}
                </h3>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
                  {duties?.filter((d) => d.status === col.id).length || 0}
                </span>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {duties
                  ?.filter((d) => d.status === col.id)
                  .map((duty) => (
                    <div key={duty.id}>
                      <DutyDetailSheet
                        duty={duty}
                        farewellId={farewellId}
                        isAdmin={isAdmin}
                        allMembers={allMembers}
                        currentUserId={currentUserId}
                      >
                        <div className="cursor-pointer">
                          <GlassDutyCard duty={duty} />
                        </div>
                      </DutyDetailSheet>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <DndContext
      id="kanban-board-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex justify-end mb-2">
        {isAdmin && (
          <span className="text-xs text-yellow-500 font-mono bg-yellow-500/10 px-2 py-1 rounded">
            Admin Mode
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            duties={duties?.filter((d) => d.status === col.id) || []}
            farewellId={farewellId}
            isAdmin={isAdmin}
            allMembers={allMembers}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeId ? (
          <GlassDutyCard
            duty={duties.find((d) => d.id === activeId)!}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  title,
  duties,
  farewellId,
  isAdmin,
  allMembers,
  currentUserId,
}: {
  id: ColumnId;
  title: string;
  duties: Duty[];
  farewellId: string;
  isAdmin: boolean;
  allMembers: any[];
  currentUserId: string;
}) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
      columnId: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 p-4 min-h-[200px]"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-white/90">{title}</h3>
        <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
          {duties.length}
        </span>
      </div>

      <SortableContext
        items={duties.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3 flex-1">
          {duties.map((duty) => (
            <SortableDutyItem
              key={duty.id}
              duty={duty}
              farewellId={farewellId}
              isAdmin={isAdmin}
              allMembers={allMembers}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableDutyItem({
  duty,
  farewellId,
  isAdmin,
  allMembers,
  currentUserId,
}: {
  duty: Duty;
  farewellId: string;
  isAdmin: boolean;
  allMembers: any[];
  currentUserId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: duty.id,
    data: {
      type: "Duty",
      duty,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DutyDetailSheet
        duty={duty}
        farewellId={farewellId}
        isAdmin={isAdmin}
        allMembers={allMembers}
        currentUserId={currentUserId}
      >
        <div className="cursor-pointer">
          <GlassDutyCard duty={duty} />
        </div>
      </DutyDetailSheet>
    </div>
  );
}
