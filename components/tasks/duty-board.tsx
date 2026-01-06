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
import { updateDutyAction, Duty } from "@/app/actions/duty-actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Circle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  MoreHorizontal,
  Users,
  CalendarDays,
  Shield,
  DollarSign,
  FileText,
  Vote,
  Gavel,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DutyDetailSheet } from "@/components/duties/v4/duty-detail-sheet";
import { CreateDutyWizard } from "@/components/duties/create-duty-wizard";

// --- Types ---

function DutyCard({ duty, onClick }: { duty: Duty; onClick?: () => void }) {
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
    touchAction: "none",
  };

  const isOverdue =
    duty.deadline &&
    new Date(duty.deadline) < new Date() &&
    duty.status !== "completed" &&
    duty.status !== "approved";

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 h-[140px] bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg skew-x-[-5deg]"
      />
    );
  }

  // Visuals based on status/priority
  const priorityColor =
    duty.priority === "high"
      ? "text-orange-500 border-orange-500/50"
      : duty.priority === "medium"
      ? "text-yellow-500 border-yellow-500/50"
      : "text-blue-500 border-blue-500/50";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={duty.id}
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative mb-3 cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <div
        className={cn(
          "relative overflow-hidden backdrop-blur-sm border rounded-lg transition-all duration-300",
          "bg-transparent hover:bg-white/5",
          priorityColor,
          "border-l-[4px]"
        )}
      >
        <CardContent className="p-3 space-y-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center justify-between opacity-60">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  {duty.id.slice(0, 4)}
                </span>
              </div>
              {/* Status Badge */}
              {duty.status === "voting" && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 h-4 border-purple-500 text-purple-400"
                >
                  <Vote className="w-2 h-2 mr-1" /> VOTE
                </Badge>
              )}
              {duty.status === "admin_review" && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 h-4 border-amber-500 text-amber-400"
                >
                  <Gavel className="w-2 h-2 mr-1" /> REVIEW
                </Badge>
              )}
            </div>
            <h4 className="font-bold text-sm leading-tight text-foreground/90 line-clamp-2">
              {duty.title}
            </h4>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Expense Limit/Amount */}
            {(duty.expected_amount > 0 || (duty as any).expense_limit > 0) && (
              <div className="text-[9px] px-1.5 py-0.5 font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-sm flex items-center">
                <DollarSign className="w-2 h-2 mr-1" />
                {formatCurrency(
                  duty.expected_amount || (duty as any).expense_limit
                )}
              </div>
            )}
            {/* Deadline */}
            {duty.deadline && (
              <div
                className={cn(
                  "flex items-center text-[10px] px-2 py-0.5 rounded-sm border font-mono tracking-tighter",
                  isOverdue
                    ? "text-red-400 border-red-500/30"
                    : "text-slate-400 border-slate-500/20"
                )}
              >
                <CalendarDays className="w-3 h-3 mr-1.5" />
                {format(new Date(duty.deadline), "MM.dd")}
              </div>
            )}
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          <div className="flex justify-between items-center">
            <div className="flex -space-x-2 pl-1">
              {duty.assignments?.map((a) => (
                <Avatar
                  key={a.id}
                  className="w-6 h-6 border-[1.5px] border-background ring-1 ring-white/10"
                >
                  <AvatarImage src={a.user?.avatar_url || ""} />
                  <AvatarFallback className="text-[8px]">
                    {a.user?.full_name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {(!duty.assignments || duty.assignments.length === 0) && (
                <span className="text-[10px] text-muted-foreground opacity-50">
                  UNASSIGNED
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </motion.div>
  );
}

function DutyColumn({
  id,
  title,
  duties,
  icon: Icon,
  onDutyClick,
}: {
  id: string;
  title: string;
  duties: Duty[];
  icon: any;
  onDutyClick: (d: Duty) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-h-0 min-w-[300px] w-full max-w-[360px] md:w-[320px]">
      <div className="flex items-center justify-between p-4 mb-3 rounded-2xl border bg-transparent backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <Icon className="w-4 h-4 opacity-80" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            <p className="text-[10px] text-muted-foreground font-medium">
              {duties.length} Items
            </p>
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-0 rounded-3xl p-2 transition-colors",
          isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-transparent"
        )}
      >
        <ScrollArea className="h-full pr-3 pb-20">
          <div className="space-y-3 pb-4">
            <SortableContext
              items={duties.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {duties.map((duty) => (
                <DutyCard
                  key={duty.id}
                  duty={duty}
                  onClick={() => onDutyClick(duty)}
                />
              ))}
            </SortableContext>
            {duties.length === 0 && (
              <div className="h-32 border-2 border-dashed border-muted/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                <Icon className="w-6 h-6 opacity-20" />
                <span className="text-xs font-medium">No items</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface DutyBoardProps {
  initialDuties: Duty[];
  farewellMembers: any[];
  farewellId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function DutyBoard({
  initialDuties,
  farewellMembers,
  farewellId,
  currentUserId,
  isAdmin = false,
}: DutyBoardProps) {
  const [duties, setDuties] = useState<Duty[]>(initialDuties);
  const [activeDuty, setActiveDuty] = useState<Duty | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingDuty, setViewingDuty] = useState<Duty | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // IDs for DND
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    setDuties(initialDuties);
    // Sync viewingDuty
    if (viewingDuty) {
      const updated = initialDuties.find((d) => d.id === viewingDuty.id);
      if (updated) setViewingDuty(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDuties]);

  // Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-duties")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duties",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_receipts",
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_assignments",
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "receipt_votes",
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, router]);

  // Grouping Logic
  const groupedDuties = useMemo(() => {
    const groups: Record<string, Duty[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    const filetered = duties.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filetered.forEach((d) => {
      if (d.status === "pending") groups.todo.push(d);
      else if (d.status === "in_progress") groups.in_progress.push(d);
      else if (["pending_receipt", "voting", "admin_review"].includes(d.status))
        groups.review.push(d);
      else if (["completed", "approved", "rejected"].includes(d.status))
        groups.done.push(d);
      else groups.todo.push(d); // Fallback
    });

    return groups;
  }, [duties, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Duty") {
      setActiveDuty(event.active.data.current.duty as Duty);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveDuty(null);
      return;
    }

    const activeId = active.id as string;
    const currentDuty = duties.find((d) => d.id === activeId);
    if (!currentDuty) return;

    // Map Column ID -> Status
    let targetStatus: Duty["status"] | null = null;

    if (over.id === "todo") targetStatus = "pending";
    else if (over.id === "in_progress") targetStatus = "in_progress";
    else if (over.id === "review") {
      // Moving to review manually is usually 'pending_receipt' (uploaded)
      // But if we drag there, maybe we just set it to pending_receipt?
      targetStatus = "pending_receipt";
    } else if (over.id === "done") targetStatus = "completed";

    if (targetStatus && currentDuty.status !== targetStatus) {
      // Optimistic Update
      setDuties((prev) =>
        prev.map((d) =>
          d.id === activeId ? { ...d, status: targetStatus! } : d
        )
      );

      try {
        await updateDutyAction(activeId, farewellId, { status: targetStatus });
        toast.success("Duty moved");
        if (targetStatus === "completed") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10b981", "#34d399", "#059669"], // Emerald greens
          });
        }
      } catch (e) {
        toast.error("Failed to move duty");
        router.refresh();
      }
    }
    setActiveDuty(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search duties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/40 border-white/5 rounded-xl"
          />
        </div>
        {isAdmin && (
          <Button
            onClick={() => setWizardOpen(true)}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" /> New Duty
          </Button>
        )}
      </div>

      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1 -mx-4 md:mx-0">
          <div className="flex h-full gap-6 px-4 md:px-0 min-w-max pb-12">
            <DutyColumn
              id="todo"
              title="To Do"
              duties={groupedDuties.todo}
              icon={Circle}
              onDutyClick={(d) => {
                setViewingDuty(d);
                setDetailOpen(true);
              }}
            />
            <DutyColumn
              id="in_progress"
              title="In Progress"
              duties={groupedDuties.in_progress}
              icon={Clock}
              onDutyClick={(d) => {
                setViewingDuty(d);
                setDetailOpen(true);
              }}
            />
            <DutyColumn
              id="review"
              title="Review / Voting"
              duties={groupedDuties.review}
              icon={Vote}
              onDutyClick={(d) => {
                setViewingDuty(d);
                setDetailOpen(true);
              }}
            />
            <DutyColumn
              id="done"
              title="Done"
              duties={groupedDuties.done}
              icon={CheckCircle2}
              onDutyClick={(d) => {
                setViewingDuty(d);
                setDetailOpen(true);
              }}
            />
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
        <DragOverlay>
          {activeDuty && (
            <div className="rotate-3 opacity-90 scale-105">
              <DutyCard duty={activeDuty} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CreateDutyWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        farewellId={farewellId}
        onSuccess={() => router.refresh()}
      />

      {viewingDuty && (
        <DutyDetailSheet
          duty={viewingDuty}
          farewellId={farewellId}
          allMembers={farewellMembers.map((m: any) => m.user)} // Ensure structure
          isAdmin={isAdmin} // Dynamic check
          currentUserId={currentUserId}
          open={detailOpen}
          onOpenChange={(v) => {
            setDetailOpen(v);
            if (!v) setViewingDuty(null);
          }}
        >
          <span />
        </DutyDetailSheet>
      )}
    </div>
  );
}
