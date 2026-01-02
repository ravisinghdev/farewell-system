"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface TimelineDroppableProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TimelineDroppable({
  id,
  children,
  className,
}: TimelineDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-300 rounded-2xl min-h-[200px] h-full",
        isOver ? "bg-accent/30 ring-2 ring-primary/20" : "",
        className
      )}
    >
      {children}
    </div>
  );
}




