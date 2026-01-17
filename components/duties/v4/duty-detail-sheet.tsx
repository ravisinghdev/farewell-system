"use client";

import { useState } from "react";
import { Duty } from "@/types/duties";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Circle,
  FileText,
  Vote,
  Gavel,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { AssigneeManager } from "./assignee-manager";
import { ReceiptManager } from "./receipt-manager";

interface DutyDetailSheetProps {
  children: React.ReactNode;
  duty: Duty;
  farewellId: string;
  isAdmin?: boolean;
  allMembers?: any[];
  currentUserId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DutyDetailSheet({
  children,
  duty,
  farewellId,
  isAdmin = false,
  allMembers = [],
  currentUserId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: DutyDetailSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const router = useRouter();

  // Use controlled state if provided, else use internal
  const isOpen =
    controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsOpen = setControlledOpen || setUncontrolledOpen;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: duty.title,
    description: duty.description || "",
    expected_amount: duty.expected_amount?.toString() || "",
    deadline: duty.deadline,
    category: duty.category,
    status: duty.status,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { updateDutyAction } = await import("@/app/actions/duty-actions");
      const result = await updateDutyAction(duty.id, farewellId, {
        title: editForm.title,
        description: editForm.description,
        expected_amount: Number(editForm.expected_amount),
        deadline: editForm.deadline || undefined,
        category: editForm.category,
        status: editForm.status,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Duty updated successfully");
        router.refresh();
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to update duty");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this duty? This action cannot be undone."
      )
    )
      return;

    setIsSaving(true);
    try {
      const { deleteDutyAction } = await import("@/app/actions/duty-actions");
      const result = await deleteDutyAction(farewellId, duty.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Duty deleted");
        setIsOpen(false);
        router.refresh();
      }
    } catch (e) {
      toast.error("Failed to delete duty");
    } finally {
      setIsSaving(false);
    }
  };

  const THEMES = {
    violet: {
      label: "Violet",
      from: "from-violet-500/10",
      border: "border-violet-500/20",
      text: "text-violet-500 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    blue: {
      label: "Blue",
      from: "from-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    emerald: {
      label: "Emerald",
      from: "from-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    rose: {
      label: "Rose",
      from: "from-rose-500/10",
      border: "border-rose-500/20",
      text: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
    amber: {
      label: "Amber",
      from: "from-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
  };

  const currentTheme =
    THEMES[(duty.category as keyof typeof THEMES) || "violet"] || THEMES.violet;

  const priorityColor =
    {
      critical: "text-red-400 border-red-400/20 bg-red-400/10",
      high: "text-orange-400 border-orange-400/20 bg-orange-400/10",
      medium: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
      low: "text-blue-400 border-blue-400/20 bg-blue-400/10",
    }[(duty.priority as string) || "medium"] ||
    "text-zinc-400 border-zinc-400/20 bg-zinc-400/10";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30">
            <Clock className="w-3 h-3 mr-1" /> In Progress
          </Badge>
        );
      case "voting":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30">
            <Vote className="w-3 h-3 mr-1" /> Voting
          </Badge>
        );
      case "admin_review":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30">
            <Gavel className="w-3 h-3 mr-1" /> Review
          </Badge>
        );
      case "pending_receipt":
        return (
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50 hover:bg-pink-500/30">
            <DollarSign className="w-3 h-3 mr-1" /> Bill Uploaded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/50 hover:bg-zinc-500/30">
            <Circle className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  const isAssignee =
    (duty as any).assignments?.some((a: any) => a.user_id === currentUserId) ??
    false;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full pt-4 sm:max-w-md md:max-w-lg bg-background/95 backdrop-blur-xl border-l border-border text-foreground p-0 shadow-2xl"
      >
        <ScrollArea className="h-full">
          {/* Hero Header with Gradient */}
          <div className="relative p-6 pb-8 overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-b ${currentTheme.from} to-transparent pointer-events-none`}
            />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4 pr-12">
                <Badge
                  variant="outline"
                  className={`capitalize ${priorityColor} border-current bg-background/50 backdrop-blur-md px-3 py-1 text-xs tracking-wider font-medium`}
                >
                  {(duty.priority || "Medium") + " Priority"}
                </Badge>
                <div className="flex items-center gap-2">
                  {getStatusBadge(duty.status)}
                  {isAdmin && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-6 text-xs text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Edit
                    </Button>
                  )}
                  {isAdmin && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Duty"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="bg-muted/50 border-input text-xl font-bold h-12 text-foreground"
                    placeholder="Duty Title"
                  />
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs text-muted-foreground mr-2">
                        Theme:
                      </Label>
                      <Select
                        value={editForm.category || "violet"}
                        onValueChange={(val) =>
                          setEditForm((prev) => ({ ...prev, category: val }))
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-[100px] bg-muted/50 border-input">
                          <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(THEMES).map(([key, theme]) => (
                            <SelectItem key={key} value={key}>
                              {theme.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 items-center">
                        <Label className="text-xs text-muted-foreground mr-2">
                          Status:
                        </Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(val: any) =>
                            setEditForm((prev) => ({ ...prev, status: val }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-[120px] bg-muted/50 border-input">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="pending_receipt">
                              Bill Uploaded
                            </SelectItem>
                            <SelectItem value="voting">Voting</SelectItem>
                            <SelectItem value="admin_review">Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <SheetTitle className="text-3xl font-bold text-foreground tracking-tight">
                  {duty.title}
                </SheetTitle>
              )}

              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{" "}
                  {format(new Date(duty.created_at), "PPP")}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span className="flex items-center gap-1">
                  Created by {duty.assignments?.length ? "Admin" : "System"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Main Content */}
          <div className="p-6 space-y-8">
            {/* Description Card */}
            <div className="group space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
                <FileText className="w-3 h-3" /> Overview
              </h4>
              {isEditing ? (
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="bg-muted/30 border-input min-h-[120px]"
                  placeholder="Description"
                />
              ) : (
                <div className="p-5 rounded-xl bg-muted/30 border border-border text-sm text-foreground leading-relaxed transition-all duration-300">
                  {duty.description || (
                    <span className="text-muted-foreground italic">
                      No description provided for this duty.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Assignment Section */}
            {!isEditing && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Team
                </h4>
                <div className="p-1 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/10 border border-border backdrop-blur-sm shadow-inner">
                  <div className="bg-background/50 rounded-xl p-4">
                    <AssigneeManager
                      duty={duty}
                      farewellId={farewellId}
                      isAdmin={isAdmin}
                      allMembers={allMembers}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stats / Edit Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 space-y-2 hover:border-blue-500/40 transition-colors">
                <div className="text-xs text-blue-500 dark:text-blue-300/70 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Deadline
                </div>
                {isEditing ? (
                  <Input
                    type="date"
                    value={
                      editForm.deadline
                        ? new Date(editForm.deadline)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        deadline: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      }))
                    }
                    className="bg-transparent border-border text-blue-600 dark:text-blue-100 h-8 p-0 placeholder:text-blue-600/50 dark:placeholder:text-blue-100/50"
                  />
                ) : (
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-100">
                    {duty.deadline
                      ? format(new Date(duty.deadline), "MMM d, yyyy")
                      : "None"}
                  </div>
                )}
              </Card>

              <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 space-y-2 hover:border-emerald-500/40 transition-colors">
                <div className="text-xs text-emerald-600 dark:text-emerald-300/70 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Budget / Cost
                </div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editForm.expected_amount}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        expected_amount: e.target.value,
                      }))
                    }
                    className="bg-transparent border-border text-emerald-600 dark:text-emerald-100 h-8 p-0 placeholder:text-emerald-600/50 dark:placeholder:text-emerald-100/50"
                  />
                ) : (
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-100">
                    {formatCurrency(duty.expected_amount || 0)}
                  </div>
                )}
              </Card>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex-1 border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Receipt Manager */}
            {!isEditing && (
              <div className="space-y-3">
                <ReceiptManager
                  duty={duty}
                  farewellId={farewellId}
                  isAssignee={isAssignee}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                />
              </div>
            )}

            {/* Visual Footer decoration */}
            <div className="pt-8 flex justify-center opacity-30">
              <div className="w-16 h-1 rounded-full bg-white/20" />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
