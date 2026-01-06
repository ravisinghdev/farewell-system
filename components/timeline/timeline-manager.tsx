"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelineBlock } from "@/types/timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Clock, Save, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  updateTimelineOrderAction,
  deleteTimelineBlockAction,
} from "@/app/actions/event-actions";
import { TimelineBlockDialog } from "./timeline-block-dialog";
import { useRouter } from "next/navigation";

// Sortable Item Component
function SortableTimelineItem({
  block,
  startTime,
  onEdit,
  onDelete,
}: {
  block: TimelineBlock;
  startTime: Date;
  onEdit: (block: TimelineBlock) => void;
  onDelete: (blockId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const endTime = new Date(startTime.getTime() + block.duration_seconds * 1000);
  const isPerformance = block.type === "performance";

  return (
    <div ref={setNodeRef} style={style} className="mb-3 group">
      <div
        className={`
         flex items-center p-3 rounded-lg border bg-card shadow-sm
         ${
           isPerformance
             ? "border-l-4 border-l-primary"
             : "border-l-4 border-l-slate-400"
         }
       `}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 hover:bg-muted rounded mr-3"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Time Column */}
        <div className="w-24 text-xs font-mono text-muted-foreground border-r pr-3 mr-3 flex flex-col items-end justify-center">
          <span>{format(startTime, "HH:mm")}</span>
          <span className="opacity-50 text-[10px]">
            {format(endTime, "HH:mm")}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isPerformance ? (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                Act
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-5 capitalize"
              >
                {block.type}
              </Badge>
            )}
            <h4 className="font-semibold text-sm">
              {block.performance ? block.performance.title : block.title}
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(block.duration_seconds / 60)}m
            </span>
            {block.performance?.lead_coordinator && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {block.performance.lead_coordinator.full_name}
              </span>
            )}
          </div>
        </div>

        {/* Status/Risk (If Performance) */}
        {block.performance && (
          <div className="ml-auto flex flex-col items-end gap-1">
            {block.performance.risk_level === "high" && (
              <Badge variant="destructive" className="text-[10px] h-5">
                High Risk
              </Badge>
            )}
            <Badge
              variant={
                block.performance.status === "locked" ? "default" : "outline"
              }
              className="text-[10px] capitalize h-5"
            >
              {block.performance.status}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(block)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TimelineManagerProps {
  initialBlocks: TimelineBlock[];
  farewellId: string;
  eventStartTime?: string; // e.g. "2025-05-20T17:00:00"
}

export function TimelineManager({
  initialBlocks,
  farewellId,
  eventStartTime,
}: TimelineManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<TimelineBlock[]>(initialBlocks);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimelineBlock | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync props to state if props change (revalidation)
  useEffect(() => {
    setItems(initialBlocks);
  }, [initialBlocks]);

  // Drag Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        setHasChanges(true); // Flag change
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function handleSave() {
    setIsSaving(true);
    // Recalculate order indices
    const updates = items.map((item, index) => ({
      id: item.id,
      order_index: index,
      // We could also snapshot calculated start times here if we wanted
    }));

    const result = await updateTimelineOrderAction(farewellId, updates);
    if (result.error) {
      toast.error("Failed to save sequence", { description: result.error });
    } else {
      toast.success("Timeline Saved", {
        description: "Sequence updated successfully.",
      });
      setHasChanges(false);
    }
    setIsSaving(false);
  }

  async function handleDelete(blockId: string) {
    if (!confirm("Are you sure?")) return;
    const res = await deleteTimelineBlockAction(blockId, farewellId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Deleted");
      router.refresh();
    }
  }

  function handleEdit(block: TimelineBlock) {
    setEditingBlock(block);
    setIsDialogOpen(true);
  }

  function handleAddNew() {
    setEditingBlock(null);
    setIsDialogOpen(true);
  }

  // Calculate Start Times dynamically
  const baseTime = eventStartTime ? new Date(eventStartTime) : new Date(); // Fallback to now
  // We actually need a fixed reference point, usually fetched from Event Details.
  // For now, let's assume 5:00 PM today for demo if not provided.
  if (!eventStartTime) baseTime.setHours(17, 0, 0, 0);

  let currentTime = new Date(baseTime);

  return (
    <div className="space-y-4 pb-24">
      <TimelineBlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farewellId={farewellId}
        blockToEdit={editingBlock}
        currentOrderIndex={items.length}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Stage Sequence</h3>
          {hasChanges && (
            <Badge variant="secondary" className="text-amber-600 bg-amber-50">
              Unsaved Changes
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          <Button size="sm" variant="outline" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" /> Add Event
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Sequence"}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0">
            {items.map((block) => {
              const startTime = new Date(currentTime);
              // Increment for next item
              currentTime = new Date(
                currentTime.getTime() + block.duration_seconds * 1000
              );

              return (
                <SortableTimelineItem
                  key={block.id}
                  block={block}
                  startTime={startTime}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
          No items in timeline. Add performances to get started.
        </div>
      )}
    </div>
  );
}
