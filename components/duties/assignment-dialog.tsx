"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFarewellMembers } from "@/actions/people";
import { assignDutyAction } from "@/actions/duties";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface AssignmentDialogProps {
  dutyId: string;
  farewellId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssignmentDialog({
  dutyId,
  farewellId,
  open,
  onOpenChange,
  onSuccess,
}: AssignmentDialogProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      fetchMembers();
      setSelectedIds([]);
      setSearch("");
    }
  }, [open]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getFarewellMembers(farewellId, "student"); // Or fetch all roles?
      setMembers(data || []);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await assignDutyAction(dutyId, selectedIds);
      toast.success("Duty assigned successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to assign duty");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelection = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredMembers = members.filter((m) =>
    m.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Duty</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No members found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center space-x-4"
                  >
                    <Checkbox
                      id={member.user_id}
                      checked={selectedIds.includes(member.user_id)}
                      onCheckedChange={() => toggleSelection(member.user_id)}
                    />
                    <label
                      htmlFor={member.user_id}
                      className="flex flex-1 items-center space-x-3 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback>
                          {member.user?.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {member.user?.full_name}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={submitting || selectedIds.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
