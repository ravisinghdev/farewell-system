"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Performance, PerformanceStatus } from "@/types/performance";
import { PerformanceCard } from "@/components/performances/performance-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const columns: { id: PerformanceStatus; title: string; color: string }[] = [
  { id: "draft", title: "Draft", color: "bg-slate-500/10 border-slate-500/20" },
  {
    id: "rehearsing",
    title: "Rehearsing",
    color: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "ready",
    title: "Stage Ready",
    color: "bg-green-500/10 border-green-500/20",
  },
  {
    id: "locked",
    title: "Locked",
    color: "bg-purple-500/10 border-purple-500/20",
  },
];

interface PerformanceKanbanProps {
  performances: Performance[];
  isAdmin: boolean;
  onStatusChange: (id: string, newStatus: PerformanceStatus) => void;
  onEdit: (p: Performance) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
}

export function PerformanceKanban({
  performances,
  isAdmin,
  onStatusChange,
  onEdit,
  onDelete,
  onApprove,
}: PerformanceKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activePerf = performances.find((p) => p.id === active.id);
    const overId = over.id;

    // Find drop column (either it's a column ID or a card in that column)
    let newStatus: PerformanceStatus | undefined;

    if (columns.some((c) => c.id === overId)) {
      newStatus = overId as PerformanceStatus;
    } else {
      const overPerf = performances.find((p) => p.id === overId);
      if (overPerf) newStatus = overPerf.status;
    }

    if (activePerf && newStatus && activePerf.status !== newStatus) {
      onStatusChange(activePerf.id, newStatus);
    }
  };

  const activePerf = activeId
    ? performances.find((p) => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            performances={performances.filter((p) => p.status === col.id)}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onApprove={onApprove}
          />
        ))}
      </div>

      <DragOverlay>
        {activePerf ? (
          <div className="opacity-80 rotate-2 scale-105">
            <PerformanceCard
              performance={activePerf}
              isAdmin={isAdmin}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleLock={() => {}}
              onApprove={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  title,
  color,
  performances,
  isAdmin,
  onEdit,
  onDelete,
  onApprove,
}: {
  id: PerformanceStatus;
  title: string;
  color: string;
  performances: Performance[];
  isAdmin: boolean;
  onEdit: (p: Performance) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
}) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[350px] shrink-0 rounded-xl bg-muted/50 border p-3 h-full max-h-[calc(100vh-200px)]",
        color
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary" className="rounded-full px-2">
          {performances.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        <SortableContext
          items={performances.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {performances.map((p) => (
            <SortablePerfCard
              key={p.id}
              performance={p}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              onApprove={onApprove}
            />
          ))}
        </SortableContext>
        {performances.length === 0 && (
          <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function SortablePerfCard({
  performance,
  isAdmin,
  onEdit,
  onDelete,
  onApprove,
}: {
  performance: Performance;
  isAdmin: boolean;
  onEdit: (p: Performance) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: performance.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PerformanceCard
        performance={performance}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleLock={() => {}} // Not needed in drag view? Or maybe yes.
        onApprove={onApprove}
      />
    </div>
  );
}
