"use client";

import { useTimeline } from "@/components/providers/timeline-provider";
import { TimelineStaging } from "./timeline-staging";
import { TimelineBlockItem } from "./timeline-block";
import { TimelineDroppable } from "./timeline-droppable";
import { TimelineControls } from "./timeline-controls";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { TimelineBlock } from "@/types/timeline";
import { createPortal } from "react-dom";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function TimelineBoard({ eventStartTime }: { eventStartTime?: string }) {
  const { blocks, moveBlock, removeBlock, updateBlockDuration } = useTimeline();
  const [activeId, setActiveId] = useState<string | null>(null);

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

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      moveBlock(active.id as string, over.id as string);
    }
  }

  // Calculate Running Time
  const baseTime = eventStartTime ? new Date(eventStartTime) : new Date();
  if (!eventStartTime) baseTime.setHours(17, 0, 0, 0); // Default 5 PM

  let currentTime = new Date(baseTime);

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;
  // For overlay time calculation (approximate)
  const activeBlockStartTime = new Date();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      {/* Main Timeline - 8 cols */}
      <div className="lg:col-span-8 flex flex-col h-full rounded-3xl bg-muted/20 border p-6 relative">
        <TimelineControls />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative">
            {/* Dotted Line connector */}
            <div className="absolute left-[4.5rem] top-0 bottom-0 w-px border-l-2 border-dashed border-muted-foreground/20 z-0 pointer-events-none" />

            <SortableContext
              items={blocks.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <TimelineDroppable id="timeline-list" className="pb-20 space-y-0">
                {blocks.map((block) => {
                  const startTime = new Date(currentTime);
                  currentTime = new Date(
                    currentTime.getTime() + block.duration_seconds * 1000
                  );
                  return (
                    <TimelineBlockItem
                      key={block.id}
                      block={block}
                      startTime={startTime}
                      onDelete={removeBlock}
                      onEdit={(id) => updateBlockDuration(id, 600)} // Mock edit
                    />
                  );
                })}
              </TimelineDroppable>
            </SortableContext>
          </div>

          {createPortal(
            <DragOverlay
              dropAnimation={dropAnimation}
              className="cursor-grabbing"
            >
              {activeBlock ? (
                <TimelineBlockItem
                  block={activeBlock}
                  startTime={activeBlockStartTime}
                />
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>

      {/* Sidebar - 4 cols */}
      <div className="lg:col-span-4 h-full">
        <TimelineStaging />
      </div>
    </div>
  );
}
