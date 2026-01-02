"use client";

import { TaskWithDetails } from "@/app/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Check, ClipboardList } from "lucide-react";

interface TaskNotesWidgetProps {
  tasks: TaskWithDetails[];
}

export function TaskNotesWidget({ tasks }: TaskNotesWidgetProps) {
  // Use "Todo" tasks as "Notes/Todos"
  const notes = tasks.filter((t) => t.status === "todo").slice(0, 4);

  return (
    <div className="bg-card rounded-[2rem] border shadow-sm p-6 flex flex-col text-card-foreground">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Notes
        </h2>
      </div>

      <div className="space-y-4">
        {notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
            >
              <div className="mt-1 w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary transition-colors">
                {/* Check icon on hover or click logic */}
                <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-primary/20" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{note.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {note.description || "No details..."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground text-sm py-4">
            No notes available.
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-dashed">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-primary"
        >
          + Add new note
        </Button>
      </div>
    </div>
  );
}
