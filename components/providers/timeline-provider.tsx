"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { TimelineBlock } from "@/types/timeline";
import { Performance } from "@/types/performance";
import {
  updateTimelineOrderAction,
  createTimelineBlockAction,
  deleteTimelineBlockAction,
  updatePerformanceStatusAction,
} from "@/app/actions/event-actions";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";

interface TimelineContextType {
  blocks: TimelineBlock[];
  performances: Performance[];
  availablePerformances: Performance[];
  isLoading: boolean;
  hasChanges: boolean;
  isSaving: boolean;

  // Actions
  moveBlock: (activeId: string, overId: string) => void;
  addPerformanceToTimeline: (performance: Performance) => Promise<void>;
  addBlock: (
    type: "break" | "announcement" | "buffer",
    title: string,
    duration: number
  ) => Promise<void>;
  removeBlock: (blockId: string) => Promise<void>;
  saveOrder: () => Promise<void>;
  updateBlockDuration: (blockId: string, duration: number) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(
  undefined
);

export function TimelineProvider({
  children,
  initialBlocks,
  initialPerformances,
  farewellId,
}: {
  children: ReactNode;
  initialBlocks: TimelineBlock[];
  initialPerformances: Performance[];
  farewellId: string;
}) {
  const [blocks, setBlocks] = useState<TimelineBlock[]>(initialBlocks);
  const [performances, setPerformances] =
    useState<Performance[]>(initialPerformances);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial props if they change (e.g. from server revalidation)
  useEffect(() => {
    setBlocks(initialBlocks);
    setPerformances(initialPerformances);
  }, [initialBlocks, initialPerformances]);

  const availablePerformances = performances.filter(
    (p) => !blocks.some((b) => b.performance_id === p.id)
  );

  const moveBlock = (activeId: string, overId: string) => {
    setBlocks((items) => {
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex !== newIndex) {
        setHasChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    });
  };

  const saveOrder = async () => {
    if (!hasChanges) return;
    setIsSaving(true);

    // Optimistic update implied by current state
    const updates = blocks.map((item, index) => ({
      id: item.id,
      order_index: index,
    }));

    const result = await updateTimelineOrderAction(farewellId, updates);

    if (result.error) {
      toast.error("Failed to save order");
      // Optionally revert here
    } else {
      toast.success("Timeline saved");
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  const addPerformanceToTimeline = async (p: Performance) => {
    // Optimistic add? No, let's wait for server ID for simplicity unless we generate temp IDs.
    // Let's do fast server action.
    const newIndex = blocks.length;

    // Optimistic UI update (optional, tricky without ID)
    // We'll rely on fast server revalidation for adding new items to keep IDs in sync for now.
    // Or we could generate a temp ID.

    setIsLoading(true);
    const result = await createTimelineBlockAction(farewellId, {
      type: "performance",
      title: p.title,
      performance_id: p.id,
      duration_seconds: p.duration_seconds || 300,
      order_index: newIndex,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Added to timeline");
      // Revalidation happens in action, new props will flow in.
    }
    setIsLoading(false);
  };

  const addBlock = async (
    type: "break" | "announcement" | "buffer",
    title: string,
    duration: number
  ) => {
    setIsLoading(true);
    const result = await createTimelineBlockAction(farewellId, {
      type,
      title,
      duration_seconds: duration,
      order_index: blocks.length,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${type} added`);
    }
    setIsLoading(false);
  };

  const removeBlock = async (blockId: string) => {
    // Optimistic removal
    const oldBlocks = [...blocks];
    setBlocks(blocks.filter((b) => b.id !== blockId));

    const result = await deleteTimelineBlockAction(blockId, farewellId);
    if (result.error) {
      toast.error(result.error);
      setBlocks(oldBlocks); // Revert
    } else {
      toast.success("Removed from timeline");
    }
  };

  const updateBlockDuration = (blockId: string, duration: number) => {
    // Local update only until save? Or immediate?
    // Let's do local for now if we had an edit interface connected.
    // TODO: Implement updateBlockAction
    console.log(
      "Update duration not implemented yet on server",
      blockId,
      duration
    );
  };

  return (
    <TimelineContext.Provider
      value={{
        blocks,
        performances,
        availablePerformances,
        isLoading,
        hasChanges,
        isSaving,
        moveBlock,
        addPerformanceToTimeline,
        addBlock,
        removeBlock,
        saveOrder,
        updateBlockDuration,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
}




