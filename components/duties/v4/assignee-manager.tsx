"use strict";
"use client";

import { useState } from "react";
import {
  assignDutiesAction,
  unassignDutyAction,
} from "@/app/actions/duty-actions";
import { Duty } from "@/types/duties";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Plus, Trash2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AssigneeManagerProps {
  duty: Duty;
  farewellId: string;
  isAdmin: boolean;
  allMembers: { id: string; full_name: string; avatar_url: string }[];
}

export function AssigneeManager({
  duty,
  farewellId,
  isAdmin,
  allMembers,
}: AssigneeManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const assignedUserIds = new Set(
    duty.assignments?.map((a) => a.user_id) || []
  );

  const handleAssign = async (userId: string) => {
    try {
      setLoading(true);
      const result = await assignDutiesAction(farewellId, duty.id, [userId]);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User assigned successfully");
        setOpen(false);
      }
    } catch (e) {
      toast.error("Failed to assign user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      setLoading(true);
      const result = await unassignDutyAction(farewellId, duty.id, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User removed successfully");
      }
    } catch (e) {
      toast.error("Failed to remove user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground/80 font-medium flex items-center gap-2">
          Assignees ({duty.assignments?.length || 0})
        </h4>
        {isAdmin && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary transition-all rounded-full px-3"
              >
                <Plus className="w-3 h-3 mr-1.5" /> Add Member
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[240px] bg-popover text-popover-foreground backdrop-blur-xl border-border shadow-2xl"
              side="left"
              align="start"
            >
              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Search member..."
                  className="h-9 text-xs border-b border-border"
                />
                <CommandList className="p-1">
                  <CommandEmpty className="py-4 text-xs text-center text-muted-foreground">
                    No member found.
                  </CommandEmpty>
                  <CommandGroup
                    heading={
                      <span className="text-muted-foreground/50 text-[10px] uppercase tracking-wider">
                        Available Members
                      </span>
                    }
                  >
                    {allMembers
                      .filter((m) => !assignedUserIds.has(m.id))
                      .map((member) => (
                        <CommandItem
                          key={member.id}
                          value={member.full_name}
                          onSelect={() => handleAssign(member.id)}
                          className="text-xs flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                        >
                          <Avatar className="w-6 h-6 border border-border">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                              {member.full_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {member.full_name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="space-y-2">
        {(!duty.assignments || duty.assignments.length === 0) && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <UserPlus className="w-6 h-6 text-muted-foreground/70 mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              No assignee yet
            </p>
            {isAdmin && (
              <p className="text-[10px] text-muted-foreground/60">
                Click "Add Member" to assign
              </p>
            )}
          </div>
        )}

        {duty.assignments?.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center justify-between p-2 pl-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-all group animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 ring-2 ring-border">
                <AvatarImage src={assignment.user?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                  {assignment.user?.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {assignment.user?.full_name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {assignment.user?.email}
                </span>
              </div>
            </div>

            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                onClick={() => handleUnassign(assignment.user_id)}
                disabled={loading}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
