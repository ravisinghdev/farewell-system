"use client";

import { Performance } from "@/types/performance";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface PerformanceActionsMenuProps {
  performance: Performance;
  isAdmin: boolean;
  onEdit: (p: Performance) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string, current: boolean) => void;
  onApprove?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function PerformanceActionsMenu({
  performance,
  isAdmin,
  onEdit,
  onDelete,
  onToggleLock,
  onApprove,
  onDuplicate,
}: PerformanceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(performance)}>
          Edit Details
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem
              onClick={() =>
                onToggleLock(performance.id, performance.is_locked)
              }
            >
              {performance.is_locked ? "Unlock Performance" : "Lock Details"}
            </DropdownMenuItem>

            {performance.status !== "approved" ? (
              <DropdownMenuItem
                onClick={() => onApprove?.(performance.id)}
                className="text-green-600 focus:text-green-600 font-medium"
              >
                Approve & Schedule
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onApprove?.(performance.id)}
                className="text-amber-600 focus:text-amber-600"
                disabled
              >
                Already Approved
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => onDuplicate?.(performance.id)}>
              Duplicate Act
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a href={`rehearsals?performanceId=${performance.id}`}>
                View Rehearsals
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDelete(performance.id)}
            >
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
