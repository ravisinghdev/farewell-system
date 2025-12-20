"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  createSubtaskAction,
  updateSubtaskStatusAction,
  deleteSubtaskAction,
} from "@/app/actions/duty-enhanced-actions";
import { toast } from "sonner";
import { Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubtaskManagerProps {
  dutyId: string;
  subtasks: any[];
  onUpdate: () => void;
}

export function SubtaskManager({
  dutyId,
  subtasks,
  onUpdate,
}: SubtaskManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const result = await createSubtaskAction(dutyId, { title: newTitle });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Subtask added");
        setNewTitle("");
        setAdding(false);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to add subtask");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (subtaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    try {
      const result = await updateSubtaskStatusAction(subtaskId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to update subtask");
    }
  };

  const handleDelete = async (subtaskId: string) => {
    try {
      const result = await deleteSubtaskAction(subtaskId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Subtask deleted");
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to delete subtask");
    }
  };

  const completedCount = subtasks.filter(
    (s) => s.status === "completed"
  ).length;
  const progress =
    subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedCount}/{subtasks.length} tasks
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              subtask.status === "completed" && "bg-muted/50"
            )}
          >
            <Checkbox
              checked={subtask.status === "completed"}
              onCheckedChange={() => handleToggle(subtask.id, subtask.status)}
            />
            <div className="flex-1">
              <p
                className={cn(
                  "font-medium",
                  subtask.status === "completed" &&
                    "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </p>
              {subtask.description && (
                <p className="text-sm text-muted-foreground">
                  {subtask.description}
                </p>
              )}
              {subtask.estimated_hours && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {subtask.estimated_hours}h
                </div>
              )}
            </div>
            {subtask.assigned_to && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDelete(subtask.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New */}
      {adding ? (
        <div className="flex gap-2">
          <Input
            placeholder="Subtask title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <Button onClick={handleAdd} disabled={submitting}>
            Add
          </Button>
          <Button variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subtask
        </Button>
      )}
    </div>
  );
}
