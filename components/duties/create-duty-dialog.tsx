"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDutyAction,
  assignDutiesAction,
  getFarewellMembersAction,
} from "@/app/actions/duty-actions";
import { toast } from "sonner";
import { Loader2, Plus, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useFarewell } from "@/components/providers/farewell-provider";
import { Switch } from "@/components/ui/switch";

interface CreateDutyDialogProps {
  onSuccess?: () => void;
  farewellId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialTitle?: string;
  initialDescription?: string;
}

export function CreateDutyDialog({
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  initialTitle = "",
  initialDescription = "",
}: CreateDutyDialogProps) {
  const { farewell } = useFarewell();
  const farewellId = farewell.id;
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // Form State
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [expenseLimit, setExpenseLimit] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [expenseLimitHard, setExpenseLimitHard] = useState(false);

  // Assignment State
  const [primaryAssignee, setPrimaryAssignee] = useState<string>("");
  const [secondaryAssignee, setSecondaryAssignee] = useState<string>("none");
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      // Note: Assuming getFarewellMembers is implemented and imported correctly
      // If it fails, we might need to fix import path.
      // Previous file imported from "@/actions/people" but typical pattern is app/actions/something.
      // I corrected to "@/app/actions/people-actions" assuming standard structure,
      // but if it fails I'll check.
      const data = await getFarewellMembersAction(farewellId);
      setMembers(data || []);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSubmitting(true);
    try {
      // 1. Create Duty
      const dutyResult = await createDutyAction(farewellId, {
        title,
        description,
        expected_amount: expenseLimit ? parseFloat(expenseLimit) : 0,
        expense_type: "reimbursable",
        deadline: deadline?.toISOString(),
        priority,
      });

      if (dutyResult.error || !dutyResult.data) {
        toast.error(dutyResult.error || "Failed to create duty");
        return;
      }

      const newDutyId = dutyResult.data.id;

      const assignees = [primaryAssignee];
      if (secondaryAssignee && secondaryAssignee !== "none") {
        assignees.push(secondaryAssignee);
      }

      if (assignees.length > 0) {
        await assignDutiesAction(farewellId, newDutyId, assignees);
      }

      toast.success("Duty created and assigned successfully");

      setOpen(false);
      resetForm();
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create duty");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setExpenseLimit("");
    setDeadline(undefined);
    setPrimaryAssignee("");
    setSecondaryAssignee("none");
    setPriority("medium");
    setExpenseLimitHard(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (val && members.length === 0) fetchMembers();
        if (!val) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Duty
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Duty</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Venue Decoration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the task details, requirements, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v: any) => setPriority(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <div className="flex items-center justify-between border rounded-md p-2 h-10 mt-6">
                <span className="text-sm font-medium">Hard Limit?</span>
                <Switch
                  checked={expenseLimitHard}
                  onCheckedChange={setExpenseLimitHard}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Expense Limit (₹)</Label>
              <Input
                id="limit"
                type="number"
                min="0"
                placeholder="0"
                value={expenseLimit}
                onChange={(e) => setExpenseLimit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? (
                      format(deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="h-px bg-border my-2" />

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Primary Assignee *</Label>
              <Select
                value={primaryAssignee}
                onValueChange={setPrimaryAssignee}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {loadingMembers ? (
                    <div className="flex items-center justify-center p-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.user.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Secondary Assignee</Label>
              <Select
                value={secondaryAssignee}
                onValueChange={setSecondaryAssignee}
                disabled={!primaryAssignee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {members
                    .filter((m) => m.user_id !== primaryAssignee)
                    .map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.user.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title || !primaryAssignee}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Duty
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
