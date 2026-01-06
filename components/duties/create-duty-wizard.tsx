"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createDutyAction } from "@/app/actions/duty-actions";
import { getFarewellMembersAction } from "@/app/actions/duty-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateDutyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farewellId: string;
  onSuccess: () => void;
}

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const DUTY_CATEGORIES = [
  "Decoration",
  "Food & Catering",
  "Entertainment",
  "Photography",
  "Venue Setup",
  "Gifts & Souvenirs",
  "Transportation",
  "Other",
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-blue-500/10 text-blue-600" },
  { value: "medium", label: "Medium", color: "bg-amber-500/10 text-amber-600" },
  { value: "high", label: "High", color: "bg-orange-500/10 text-orange-600" },
];

export function CreateDutyWizard({
  open,
  onOpenChange,
  farewellId,
  onSuccess,
}: CreateDutyWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");

  // Step 2: Budget
  const [budget, setBudget] = useState("");
  const [hardLimit, setHardLimit] = useState(false);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [location, setLocation] = useState("");

  // Step 3: Assignment
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();

  // Load members when opening step 3
  const loadMembers = async () => {
    if (members.length > 0) return;
    setLoadingMembers(true);
    try {
      const data = await getFarewellMembersAction(farewellId);
      setMembers(data || []);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const addBudgetItem = () => {
    setBudgetItems([
      ...budgetItems,
      {
        id: Math.random().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter((item) => item.id !== id));
  };

  const updateBudgetItem = (
    id: string,
    field: keyof BudgetItem,
    value: any
  ) => {
    setBudgetItems(
      budgetItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const totalBudgetBreakdown = budgetItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleNext = () => {
    if (step === 1 && (!title || !category)) {
      toast.error("Please fill in required fields");
      return;
    }
    if (step === 2) loadMembers();
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!title || !category || selectedMembers.length === 0) {
      toast.error("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDutyAction(farewellId, {
        title,
        description,
        category,
        priority: priority as "low" | "medium" | "high",
        expense_limit: budget ? parseFloat(budget) : 0,
        expense_limit_hard: hardLimit,
        deadline: deadline?.toISOString(),
        location,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Duty created successfully!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create duty");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("medium");
    setBudget("");
    setHardLimit(false);
    setBudgetItems([]);
    setEstimatedHours("");
    setLocation("");
    setSelectedMembers([]);
    setDeadline(undefined);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Duty Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Stage Decoration Setup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DUTY_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat.toLowerCase().replace(/\s+/g, "_")}
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                      priority === option.value
                        ? `${option.color} border-current`
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the duty, requirements, and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated-hours">Estimated Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimated-hours"
                    type="number"
                    placeholder="4"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hard-limit"
                checked={hardLimit}
                onCheckedChange={(checked) => setHardLimit(checked as boolean)}
              />
              <Label htmlFor="hard-limit" className="text-sm cursor-pointer">
                Hard Limit (Block expenses if exceeded)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Main Auditorium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Budget Breakdown (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBudgetItem}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {budgetItems.length > 0 && (
                <div className="space-y-2">
                  {budgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-2 items-start p-2 border rounded-lg"
                    >
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateBudgetItem(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          updateBudgetItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateBudgetItem(
                            item.id,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBudgetItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-medium">
                    Total: ₹{totalBudgetBreakdown.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Assign To <span className="text-destructive">*</span>
              </Label>
              <ScrollArea className="h-48 border rounded-lg p-2">
                {loadingMembers ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading members...
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No members found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => {
                          setSelectedMembers((prev) =>
                            prev.includes(member.user_id)
                              ? prev.filter((id) => id !== member.user_id)
                              : [...prev, member.user_id]
                          );
                        }}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(member.user_id)}
                          onCheckedChange={() => {}}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.avatar_url} />
                          <AvatarFallback>
                            {member.user?.full_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{member.user?.full_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {selectedMembers.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedMembers.length} member(s) selected
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-semibold">Review & Create</h3>
              <p className="text-sm text-muted-foreground">
                Check everything before creating the duty
              </p>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Title</div>
                <div className="font-medium">{title}</div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{category}</Badge>
                <Badge
                  className={
                    PRIORITY_OPTIONS.find((p) => p.value === priority)?.color
                  }
                >
                  {priority}
                </Badge>
              </div>
              {budget && (
                <div>
                  <div className="text-sm text-muted-foreground">Budget</div>
                  <div className="font-medium">
                    ₹{parseFloat(budget).toLocaleString()}
                    {hardLimit && (
                      <Badge variant="destructive" className="ml-2">
                        Hard Limit
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">
                  Assigned Members
                </div>
                <div className="font-medium">
                  {selectedMembers.length} member(s)
                </div>
              </div>
              {deadline && (
                <div>
                  <div className="text-sm text-muted-foreground">Deadline</div>
                  <div className="font-medium">{format(deadline, "PPP")}</div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create New Duty</span>
            <Badge variant="outline">Step {step}/4</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              <CheckCircle className="h-4 w-4 mr-1" />
              {submitting ? "Creating..." : "Create Duty"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
