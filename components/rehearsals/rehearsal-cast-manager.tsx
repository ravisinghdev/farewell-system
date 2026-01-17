"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  User,
  X,
  Check,
  Loader2,
  Grid2X2,
  List as ListIcon,
  Heart,
  Filter,
  LayoutGrid,
  SlidersHorizontal,
  Settings2,
  Sparkles,
  Shuffle,
  Users,
  Bell,
  Download,
  Lock,
  Unlock,
  ClipboardList,
  StickyNote,
  CheckCircle,
  Trash2,
  Copy,
} from "lucide-react";
import { updateRehearsalMetadataAction } from "@/app/actions/rehearsal-actions";
import {
  createBulkNotificationAction,
  createNotificationAction,
} from "@/app/actions/notification-actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Participant {
  user_id: string;
  name: string;
  role: string;
  avatar_url?: string;
  email?: string;
}

interface Pair {
  id: string;
  partner1: string;
  partner2: string;
  locked?: boolean;
}

interface RehearsalCastManagerProps {
  rehearsal: any;
  rehearsalId: string;
  farewellId: string;
  participants: Participant[];
  metadata: any;
  isAdmin: boolean;
  currentUserRole?: string;
  rehearsalType?: string;
  availableUsers: any[];
}

type ViewMode = "grid" | "list" | "pairs";

export function RehearsalCastManager({
  rehearsal,
  rehearsalId,
  farewellId,
  participants: initialParticipants,
  metadata,
  isAdmin,
  currentUserRole,
  rehearsalType,
  availableUsers: initialAvailableUsers,
}: RehearsalCastManagerProps) {
  // --- STATE ---
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants || []
  );
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [availableUsers] = useState<any[]>(initialAvailableUsers || []);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState("performer");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [isAddingPair, setIsAddingPair] = useState(false);

  // Automation State
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [isAutoPairing, setIsAutoPairing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);

  const allRoles = [
    "lead",
    "performer",
    "pair",
    "backup",
    "tech",
    "stage_manager",
  ];
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(
    metadata?.attendance || {}
  );
  const [notesMap, setNotesMap] = useState<Record<string, string>>(
    metadata?.notes || {}
  );

  const handleToggleAttendance = async (userId: string) => {
    const newStatus = !attendanceMap[userId];
    const newMap = { ...attendanceMap, [userId]: newStatus };
    setAttendanceMap(newMap);
    // Debounced save or immediate? Immediate for now.
    await updateRehearsalMetadataAction(rehearsalId, farewellId, {
      attendance: newMap,
    });
    toast.success(newStatus ? "Marked Present" : "Marked Absent");
  };

  const handleSaveNote = async (userId: string, note: string) => {
    const newMap = { ...notesMap, [userId]: note };
    setNotesMap(newMap);
    await updateRehearsalMetadataAction(rehearsalId, farewellId, {
      notes: newMap,
    });
    // Silent save or toast?
    toast.success("Note saved");
  };

  // --- ACTIONS ---

  const handleNotifyCast = async () => {
    if (participants.length === 0) {
      toast.warning("No cast members to notify.");
      return;
    }
    const confirm = window.confirm(
      `Send a notification to all ${participants.length} cast members?`
    );
    if (!confirm) return;

    setIsNotifying(true);
    try {
      const userIds = participants.map((p) => p.user_id);
      await createBulkNotificationAction(
        userIds,
        "Rehearsal Update",
        `You are part of the cast for ${
          rehearsal?.title || "an upcoming rehearsal"
        }. Please check the details.`
      );
      toast.success("Notifications sent to cast!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send notifications");
    } finally {
      setIsNotifying(false);
    }
  };

  const handleExportCSV = () => {
    if (participants.length === 0) return;

    // Create CSV content
    const headers = ["Name", "Role", "Email", "User ID"];
    const rows = participants.map((p) => [
      `"${p.name}"`,
      `"${p.role}"`,
      `"${p.email || ""}"`,
      `"${p.user_id}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cast_list_${rehearsalId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Cast list exported!");
  };

  // --- ACTIONS ---

  async function handleAdd(user: any) {
    if (participants.some((p) => p.user_id === user.id)) {
      toast.error("User already in cast");
      return;
    }
    const newPerson: Participant = {
      user_id: user.id,
      name: user.full_name || "Unknown",
      role: selectedRoleForAdd,
      avatar_url: user.avatar_url,
      email: user.email,
    };
    const updated = [...participants, newPerson];
    saveCast(updated);
    setAddMemberOpen(false);
    toast.success(`${newPerson.name} added`);
  }

  async function handleRemove(userId: string) {
    // If user is in a pair, warn or remove from pair first?
    // Logic: If removed from cast, they are removed from pair automatically by save logic constraint?
    // Actually our current save logic might leave a dangling ID in the pair object if we don't clean it.
    // Let's clean pairs too.

    const updatedPairs = pairs.map((p) => ({
      ...p,
      partner1: p.partner1 === userId ? "" : p.partner1,
      partner2: p.partner2 === userId ? "" : p.partner2,
    }));

    // If a pair becomes empty or single, we keep it but it will show empty.
    // But we need to save pairs change as well.
    const updated = participants.filter((p) => p.user_id !== userId);

    setParticipants(updated);
    setPairs(updatedPairs);

    await updateRehearsalMetadataAction(rehearsalId, farewellId, {
      participants: updated,
      pairs: updatedPairs,
    });
    toast.success("Member removed");
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    const updated = participants.map((p) =>
      p.user_id === userId ? { ...p, role: newRole } : p
    );
    await saveCast(updated);
    toast.success("Role updated");
  }

  async function saveCast(newCast: Participant[]) {
    setParticipants(newCast);
    await updateRehearsalMetadataAction(rehearsalId, farewellId, {
      participants: newCast,
    });
  }

  // --- AUTOMATION ACTIONS ---

  async function handleBulkAdd() {
    setIsBulkAdding(true);
    try {
      const currentIds = new Set(participants.map((p) => p.user_id));
      const newMembers = availableUsers
        .filter((u) => !currentIds.has(u.id))
        .map((u) => ({
          user_id: u.id,
          name: u.full_name || "Unknown",
          role: "performer", // Default role
          avatar_url: u.avatar_url,
          email: u.email,
        }));

      if (newMembers.length === 0) {
        toast.info("All users are already in the cast!");
        return;
      }

      const updated = [...participants, ...newMembers];
      await saveCast(updated);
      toast.success(`Added ${newMembers.length} members`);
    } catch (e) {
      toast.error("Bulk add failed");
    } finally {
      setIsBulkAdding(false);
    }
  }

  async function handleAutoPair() {
    setIsAutoPairing(true);
    try {
      // 1. Identification
      const lockedPairs = pairs.filter((p) => p.locked);
      const lockedUserIds = new Set(
        lockedPairs.flatMap((p) => [p.partner1, p.partner2].filter(Boolean))
      );

      const currentlyPairedIds = getAllPairedUserIds(); // This gets ALL paired IDs

      // We only want to re-shuffle users who are NOT in a locked pair
      const eligibleUsers = availableUsers.filter(
        (u) => !currentlyPairedIds.has(u.id)
      );

      if (eligibleUsers.length < 2) {
        toast.warning("Not enough unassigned users to create pairs.");
        return;
      }

      const shuffled = [...eligibleUsers].sort(() => 0.5 - Math.random());

      // Start with existing pairs
      const newPairsList = [...pairs];
      let addedCount = 0;

      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const u1 = shuffled[i];
        const u2 = shuffled[i + 1];

        newPairsList.push({
          id: Math.random().toString(36).substring(7),
          partner1: u1.id,
          partner2: u2.id,
          locked: false,
        });
        addedCount++;
      }

      setPairs(newPairsList);
      await savePairs(newPairsList);
      toast.success(`Auto-generated ${addedCount} new pairs!`);
      setViewMode("pairs");
    } catch (e) {
      console.error(e);
      toast.error("Auto-pair failed");
    } finally {
      setIsAutoPairing(false);
    }
  }

  const togglePairLock = async (pairId: string) => {
    const updatedPairs = pairs.map((p) =>
      p.id === pairId ? { ...p, locked: !p.locked } : p
    );
    setPairs(updatedPairs);
    toast.success("Pair status updated");
    await savePairs(updatedPairs);
  };

  async function handleClearAll() {
    if (!confirm("Are you sure? This will remove all cast members and pairs."))
      return;
    setParticipants([]);
    setPairs([]);
    await updateRehearsalMetadataAction(rehearsalId, farewellId, {
      participants: [],
      pairs: [],
    });
    toast.success("Cast cleared");
  }

  const handleCopyToClipboard = () => {
    const text = participants.map((p) => `${p.name} - ${p.role}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Cast list copied to clipboard");
  };

  // --- PAIR ACTIONS ---

  async function handleAddPair() {
    setIsAddingPair(true);
    try {
      const newPairs = [
        ...pairs,
        {
          id: Math.random().toString(36).substring(7),
          partner1: "",
          partner2: "",
        },
      ];
      setPairs(newPairs);
      await savePairs(newPairs);
      setViewMode("pairs"); // Auto switch to pair view
    } catch (error) {
      toast.error("Failed to add couple");
    } finally {
      setIsAddingPair(false);
    }
  }

  async function handleRemovePair(pairId: string) {
    const newPairs = pairs.filter((p) => p.id !== pairId);
    setPairs(newPairs);
    await savePairs(newPairs);
  }

  async function handleUpdatePair(
    pairId: string,
    field: "partner1" | "partner2",
    userId: string
  ) {
    const newPairs = pairs.map((p) =>
      p.id === pairId ? { ...p, [field]: userId } : p
    );
    setPairs(newPairs);
    await savePairs(newPairs);

    if (userId) {
      // Optional: Rate limit or check if notification already exists to avoid spam
      // For now, valid.
      createNotificationAction(
        userId,
        "New Pair Assignment",
        `You have been added to a pair in rehearsal: ${rehearsal.title}`,
        `/dashboard/${farewellId}/rehearsals/${rehearsalId}`
      );
    }
  }

  async function savePairs(newPairs: Pair[]) {
    // Re-construct participants list based on pairs to ensure roles are correct
    const usedIds = new Set<string>();
    const newParticipants: Participant[] = [];
    const getUser = (id: string) => availableUsers.find((u) => u.id === id);

    newPairs.forEach((pair, index) => {
      if (pair.partner1 && pair.partner2) {
        const u1 = getUser(pair.partner1);
        const u2 = getUser(pair.partner2);
        if (u1 && !usedIds.has(u1.id)) {
          newParticipants.push({
            user_id: u1.id,
            name: u1.full_name,
            role: `Pair ${index + 1} - Partner 1`,
            avatar_url: u1.avatar_url,
            email: u1.email,
          });
          usedIds.add(u1.id);
        }
        if (u2 && !usedIds.has(u2.id)) {
          newParticipants.push({
            user_id: u2.id,
            name: u2.full_name,
            role: `Pair ${index + 1} - Partner 2`,
            avatar_url: u2.avatar_url,
            email: u2.email,
          });
          usedIds.add(u2.id);
        }
      }
    });

    const newPairUserIds = new Set(
      newPairs.flatMap((p) => [p.partner1, p.partner2].filter(Boolean))
    );

    // Preserve modifications to role if they are NOT pair roles?
    // Actually, if a user is in a pair, their role IS pair role.

    const preservedParticipants = participants
      .map((p) => {
        if (newPairUserIds.has(p.user_id)) return null; // Logic: covered by newParticipants

        // If they were previously in a pair (role has 'Pair'/'Partner') but NOT in newPairUserIds, revert to 'performer'
        if (
          (p.role.includes("Pair") || p.role.includes("Partner")) &&
          !newPairUserIds.has(p.user_id)
        ) {
          return { ...p, role: "performer" };
        }
        return p;
      })
      .filter((p): p is Participant => p !== null);

    const finalCast = [...preservedParticipants, ...newParticipants];
    setParticipants(finalCast);
    await updateRehearsalMetadataAction(rehearsalId, farewellId, {
      pairs: newPairs,
      participants: finalCast,
      is_pair: true,
    });
  }

  const getAllPairedUserIds = () => {
    const ids = new Set<string>();
    pairs.forEach((p) => {
      if (p.partner1) ids.add(p.partner1);
      if (p.partner2) ids.add(p.partner2);
    });
    return ids;
  };

  // --- MEMOIZED DATA ---
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter.length === 0 || roleFilter.includes(p.role);
      return matchesSearch && matchesRole;
    });
  }, [participants, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    const total = participants.length;
    const leads = participants.filter(
      (p) => p.role.toLowerCase() === "lead"
    ).length;
    const pairMembers = participants.filter(
      (p) => p.role.includes("Pair") || p.role.includes("Partner")
    ).length;
    const performers = participants.filter(
      (p) => p.role.toLowerCase() === "performer"
    ).length;
    const others = total - leads - pairMembers - performers;
    // pairs count is distinct pairs
    const pairsCount = pairs.length;
    return { total, leads, pairMembers, performers, others, pairs: pairsCount };
  }, [participants, pairs]);

  // --- RENDER HELPERS ---
  const RoleBadge = ({ role }: { role: string }) => {
    const isLead = role.toLowerCase() === "lead";
    const isPair = role.toLowerCase().includes("pair");
    const isTech =
      role.toLowerCase() === "tech" || role.toLowerCase() === "stage_manager";
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] uppercase tracking-wider font-medium border-0 px-2 py-0.5 max-w-full truncate",
          isLead
            ? "bg-primary/10 text-primary"
            : isPair
            ? "bg-pink-500/10 text-pink-500"
            : isTech
            ? "bg-amber-500/10 text-amber-500"
            : "bg-secondary/50 text-muted-foreground"
        )}
      >
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. DASHBOARD STATS */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-1 transition-all hover:bg-white/[0.04] group">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Cast
              </span>
              <Users className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-1 transition-all hover:bg-white/[0.04] group">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Leads
              </span>
              <Settings2 className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-2xl font-bold text-primary">
              {stats.leads}
            </span>
          </div>
          <div
            className={`p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-1 transition-all cursor-pointer group ${
              viewMode === "pairs"
                ? "ring-1 ring-violet-500/50 bg-violet-500/[0.05]"
                : "hover:bg-violet-500/[0.02]"
            }`}
            onClick={() => setViewMode("pairs")}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                Duos
              </span>
              <Heart
                className={`w-4 h-4 text-muted-foreground/30 group-hover:text-violet-500 transition-colors ${
                  viewMode === "pairs" && "text-violet-500 fill-violet-500/20"
                }`}
              />
            </div>
            <span className="text-2xl font-bold text-violet-500">
              {stats.pairs}
            </span>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-1 transition-all hover:bg-white/[0.04]">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Available
              </span>
              <User className="w-4 h-4 text-muted-foreground/30" />
            </div>
            <span className="text-2xl font-bold">
              {availableUsers.length - stats.total}
            </span>
          </div>
        </div>

        {/* Role Distribution Bar */}
        {participants.length > 0 && (
          <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-secondary/20">
            <div
              style={{ width: `${(stats.leads / stats.total) * 100}%` }}
              className="h-full bg-primary"
              title="Leads"
            />
            <div
              style={{ width: `${(stats.pairMembers / stats.total) * 100}%` }}
              className="h-full bg-violet-500"
              title="Duos"
            />
            <div
              style={{ width: `${(stats.performers / stats.total) * 100}%` }}
              className="h-full bg-indigo-400"
              title="Performers"
            />
            <div
              style={{ width: `${(stats.others / stats.total) * 100}%` }}
              className="h-full bg-muted-foreground/50"
              title="Others"
            />
          </div>
        )}
      </div>

      {/* 2. TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center justify-between sticky top-[130px] z-10 py-4 bg-background/80 backdrop-blur-md -mx-4 px-4 border-b border-white/5 shadow-sm">
        <div className="flex flex-1 items-center gap-2 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cast members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 hover:border-primary/30 transition-colors"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-dashed gap-2 bg-transparent hover:bg-secondary/30"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter</span>
                {roleFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-[18px] px-1.5 text-[10px]"
                  >
                    {roleFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allRoles.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={roleFilter.includes(role)}
                  onCheckedChange={(checked) => {
                    if (checked) setRoleFilter([...roleFilter, role]);
                    else setRoleFilter(roleFilter.filter((r) => r !== role));
                  }}
                >
                  <span className="capitalize">{role}</span>
                </DropdownMenuCheckboxItem>
              ))}
              {roleFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs text-muted-foreground focus:text-foreground cursor-pointer"
                    onSelect={() => setRoleFilter([])}
                  >
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Automation / Bulk Menu */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-dashed bg-transparent hover:bg-secondary/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Automation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleAutoPair}
                  disabled={isAutoPairing}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {isAutoPairing ? "Pairing..." : "Auto-Pair Remaining"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleBulkAdd}
                  disabled={isBulkAdding}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {isBulkAdding ? "Adding..." : "Add All Remaining Users"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClearAll}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Entire Cast
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Cast List</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <TooltipProvider>
            <div className="flex items-center p-1 rounded-lg border bg-muted/20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      viewMode === "grid"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid View</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsAttendanceMode(!isAttendanceMode)}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      isAttendanceMode
                        ? "bg-amber-500/10 text-amber-500"
                        : "text-muted-foreground hover:text-amber-500"
                    )}
                  >
                    <ClipboardList className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isAttendanceMode
                      ? "Exit Attendance Mode"
                      : "Attendance Mode"}
                  </p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px bg-white/10 mx-1 my-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      viewMode === "list"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List View</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("pairs")}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      viewMode === "pairs"
                        ? "bg-background shadow-sm text-violet-500"
                        : "text-muted-foreground hover:text-violet-500"
                    )}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duos View</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {isAdmin && (
            <Popover open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 gap-2 shadow-sm font-medium bg-foreground text-background hover:bg-foreground/90"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Member</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[280px]" align="end">
                <div className="p-2 border-b">
                  <Select
                    value={selectedRoleForAdd}
                    onValueChange={setSelectedRoleForAdd}
                  >
                    <SelectTrigger className="h-8 text-xs border-0 bg-secondary/50">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="performer">Performer</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                      <SelectItem value="tech">Crew</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Command>
                  <CommandInput
                    placeholder="Search users..."
                    className="h-9 text-xs"
                  />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup className="overflow-y-auto max-h-[200px]">
                      {availableUsers.map((user) => {
                        const isAdded = participants.some(
                          (p) => p.user_id === user.id
                        );
                        return (
                          <CommandItem
                            key={user.id}
                            value={user.full_name}
                            onSelect={() => handleAdd(user)}
                            disabled={isAdded}
                            className="text-xs"
                          >
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-[8px]">
                                {(user.full_name || "?")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.full_name}
                            {isAdded && (
                              <Check className="ml-auto h-3 w-3 opacity-50" />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* 3. CONTENT VIEWS */}

      {/* --- GRID VIEW --- */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in-50 duration-500">
          {filteredParticipants.map((person) => (
            <div
              key={person.user_id}
              className="group relative flex flex-col items-center text-center p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <Avatar className="h-14 w-14 mb-3 border-2 border-secondary/20 shadow-sm group-hover:scale-105 transition-transform group-hover:border-primary/20">
                <AvatarImage src={person.avatar_url} />
                <AvatarFallback className="bg-muted text-lg">
                  {(person.name || "?").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h3 className="font-semibold text-sm truncate w-full px-2">
                {person.name}
              </h3>

              <div className="mt-2 mb-3">
                <RoleBadge role={person.role} />
              </div>

              {isAdmin && !person.role.includes("Pair") && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {isAttendanceMode ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 transition-all shadow-sm",
                        attendanceMap[person.user_id]
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAttendance(person.user_id);
                      }}
                      title={
                        attendanceMap[person.user_id]
                          ? "Mark Absent"
                          : "Mark Present"
                      }
                    >
                      {attendanceMap[person.user_id] ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </Button>
                  ) : (
                    <>
                      <DropdownMenu>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                >
                                  <SlidersHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Change Role</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {[
                            "lead",
                            "performer",
                            "backup",
                            "tech",
                            "choreographer",
                          ].map((r) => (
                            <DropdownMenuCheckboxItem
                              key={r}
                              checked={person.role === r}
                              onCheckedChange={() =>
                                handleUpdateRole(person.user_id, r)
                              }
                            >
                              <span className="capitalize">{r}</span>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemove(person.user_id)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove Member</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              )}

              {/* Force show attendance status in grid even if not hovering when mode is on */}
              {isAttendanceMode && (
                <div
                  className={cn(
                    "absolute top-2 right-2 transition-all duration-300",
                    attendanceMap[person.user_id]
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100" // Show check always if present, show X only on hover? Or just always show logic above?
                  )}
                >
                  {/* Actually the above div handles hover. Let's make an indicator that is always visible for PRESENT people */}
                </div>
              )}
              {isAdmin && !person.role.includes("Pair") && (
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 text-muted-foreground hover:text-amber-300",
                                notesMap[person.user_id] &&
                                  "text-amber-400 opacity-100"
                              )}
                            >
                              <StickyNote className="w-3.5 h-3.5" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Private Note</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-64 p-3">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none text-xs text-muted-foreground mb-1">
                          Performance Notes (Private)
                        </h4>
                        <Textarea
                          placeholder="Add notes about performance, costume, etc..."
                          className="text-xs h-24 resize-none bg-background/50"
                          defaultValue={notesMap[person.user_id] || ""}
                          onBlur={(e) =>
                            handleSaveNote(person.user_id, e.target.value)
                          }
                        />
                        <p className="text-[10px] text-muted-foreground text-right italic">
                          Auto-saved on close
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {isAttendanceMode && attendanceMap[person.user_id] && (
                <div className="absolute top-2 left-2 pointer-events-none">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="rounded-xl border border-white/5 overflow-hidden animate-in fade-in-50 duration-500 bg-white/[0.01]">
          <div className="grid grid-cols-12 gap-4 p-3 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/5">
            <div className="col-span-1"></div>
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Role</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          <div>
            {filteredParticipants.map((person) => (
              <div
                key={person.user_id}
                className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-muted/10 transition-colors border-b last:border-0 border-white/5 group"
              >
                <div className="col-span-1 flex justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(person.name || "?").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="col-span-4 font-medium text-sm">
                  {person.name}
                </div>
                <div className="col-span-4">
                  <RoleBadge role={person.role} />
                </div>
                <div className="col-span-3 flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                  {isAdmin && !person.role.includes("Pair") && (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            Edit Role
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {[
                            "lead",
                            "performer",
                            "backup",
                            "tech",
                            "choreographer",
                          ].map((r) => (
                            <DropdownMenuCheckboxItem
                              key={r}
                              checked={person.role === r}
                              onCheckedChange={() =>
                                handleUpdateRole(person.user_id, r)
                              }
                            >
                              <span className="capitalize">{r}</span>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(person.user_id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}

                  {isAdmin && (
                    <Popover>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 text-muted-foreground hover:text-amber-300",
                                  notesMap[person.user_id] && "text-amber-400"
                                )}
                              >
                                <StickyNote className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Performance Notes</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none text-xs text-muted-foreground mb-1">
                            Performance Notes
                          </h4>
                          <Textarea
                            placeholder="Add private notes..."
                            className="text-xs h-24 resize-none bg-background/50"
                            defaultValue={notesMap[person.user_id] || ""}
                            onBlur={(e) =>
                              handleSaveNote(person.user_id, e.target.value)
                            }
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {isAttendanceMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-7 w-7 p-0",
                        attendanceMap[person.user_id]
                          ? "text-green-500 hover:text-green-600 bg-green-500/10"
                          : "text-muted-foreground hover:text-red-500"
                      )}
                      onClick={() => handleToggleAttendance(person.user_id)}
                    >
                      {attendanceMap[person.user_id] ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-current" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PAIRS VIEW --- */}
      {viewMode === "pairs" && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between p-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.03] shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-violet-500 flex items-center gap-2">
                Duo Configuration
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage pairs and partner assignments. {pairs.length} duos
                active.
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={handleAddPair}
                disabled={isAddingPair}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-lg shadow-violet-900/20"
              >
                {isAddingPair ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Duo
              </Button>
            )}
          </div>

          {/* Auto Pair Suggestion if relevant */}
          {isAdmin && pairs.length === 0 && availableUsers.length > 2 && (
            <div className="flex items-center gap-4 p-4 border border-dashed border-amber-500/30 bg-amber-500/[0.05] rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                  Auto-Pair Available?
                </h4>
                <p className="text-xs text-muted-foreground">
                  You can automatically generate pairs from unassigned members.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                onClick={handleAutoPair}
              >
                Auto-Assign
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pairs.map((pair, index) => (
              <div
                key={pair.id}
                className="relative rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-6 group hover:border-violet-500/40 transition-all hover:bg-white/[0.03] hover:shadow-xl hover:shadow-violet-900/5 min-h-[180px] flex flex-col justify-center"
              >
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted/50 text-muted-foreground group-hover:bg-violet-500/10 group-hover:text-violet-500 transition-colors">
                  DUO #{index + 1}
                </div>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                            onClick={() => togglePairLock(pair.id)}
                          >
                            {pair.locked ? (
                              <Lock className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{pair.locked ? "Unlock Duo" : "Lock Duo"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemovePair(pair.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove Duo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 gap-2 sm:gap-4">
                  {/* Partner 1 */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          role="combobox"
                          className="w-full h-[80px] py-2 text-xs text-center border border-white/5 bg-secondary/5 hover:bg-secondary/20 hover:border-violet-500/20 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 group/p1"
                        >
                          {pair.partner1 ? (
                            <>
                              <Avatar className="w-10 h-10 border-2 border-transparent group-hover/p1:border-violet-500/30 transition-all">
                                <AvatarImage
                                  src={
                                    availableUsers.find(
                                      (u) => u.id === pair.partner1
                                    )?.avatar_url
                                  }
                                />
                                <AvatarFallback className="text-xs">
                                  {availableUsers
                                    .find((u) => u.id === pair.partner1)
                                    ?.full_name?.substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[140px] sm:max-w-[180px] font-medium group-hover/p1:text-violet-200">
                                {
                                  availableUsers.find(
                                    (u) => u.id === pair.partner1
                                  )?.full_name
                                }
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/30 group-hover/p1:border-violet-500/30 transition-colors">
                                <User className="w-4 h-4 text-muted-foreground/50 group-hover/p1:text-violet-500/50" />
                              </span>
                              <span className="text-muted-foreground italic group-hover/p1:text-violet-500/50">
                                Select
                              </span>
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[200px]">
                        <Command>
                          <CommandInput
                            placeholder="Search..."
                            className="h-9 text-xs"
                          />
                          <CommandList>
                            <CommandEmpty>No results</CommandEmpty>
                            <CommandGroup heading="Available Users">
                              {availableUsers.map((u) => (
                                <CommandItem
                                  key={u.id}
                                  value={u.full_name}
                                  onSelect={() =>
                                    handleUpdatePair(pair.id, "partner1", u.id)
                                  }
                                  disabled={
                                    getAllPairedUserIds().has(u.id) &&
                                    u.id !== pair.partner1
                                  }
                                >
                                  <Avatar className="h-5 w-5 mr-2">
                                    <AvatarImage src={u.avatar_url} />
                                    <AvatarFallback className="text-[10px]">
                                      {(u.full_name || "?")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {u.full_name}
                                  {u.id === pair.partner1 && (
                                    <Check className="ml-auto h-3 w-3 opacity-50" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Link Icon */}
                  <div className="text-violet-200/20 group-hover:text-violet-500/50 flex flex-col items-center justify-center transition-colors">
                    <Heart className="w-6 h-6 fill-current" />
                    <div className="w-8 h-px bg-current my-2"></div>
                    <div className="w-1 h-1 rounded-full bg-current"></div>
                  </div>

                  {/* Partner 2 */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          role="combobox"
                          className="w-full h-[80px] py-2 text-xs text-center border border-white/5 bg-secondary/5 hover:bg-secondary/20 hover:border-violet-500/20 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 group/p2"
                        >
                          {pair.partner2 ? (
                            <>
                              <Avatar className="w-10 h-10 border-2 border-transparent group-hover/p2:border-violet-500/30 transition-all">
                                <AvatarImage
                                  src={
                                    availableUsers.find(
                                      (u) => u.id === pair.partner2
                                    )?.avatar_url
                                  }
                                />
                                <AvatarFallback className="text-xs">
                                  {availableUsers
                                    .find((u) => u.id === pair.partner2)
                                    ?.full_name?.substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[140px] sm:max-w-[180px] font-medium group-hover/p2:text-violet-200">
                                {
                                  availableUsers.find(
                                    (u) => u.id === pair.partner2
                                  )?.full_name
                                }
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/30 group-hover/p2:border-violet-500/30 transition-colors">
                                <User className="w-4 h-4 text-muted-foreground/50 group-hover/p2:text-violet-500/50" />
                              </span>
                              <span className="text-muted-foreground italic group-hover/p2:text-violet-500/50">
                                Select
                              </span>
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[200px]">
                        <Command>
                          <CommandInput
                            placeholder="Search..."
                            className="h-9 text-xs"
                          />
                          <CommandList>
                            <CommandEmpty>No results</CommandEmpty>
                            <CommandGroup heading="Available Users">
                              {availableUsers.map((u) => (
                                <CommandItem
                                  key={u.id}
                                  value={u.full_name}
                                  onSelect={() =>
                                    handleUpdatePair(pair.id, "partner2", u.id)
                                  }
                                  disabled={
                                    getAllPairedUserIds().has(u.id) &&
                                    u.id !== pair.partner2
                                  }
                                >
                                  <Avatar className="h-5 w-5 mr-2">
                                    <AvatarImage src={u.avatar_url} />
                                    <AvatarFallback className="text-[10px]">
                                      {(u.full_name || "?")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {u.full_name}
                                  {u.id === pair.partner2 && (
                                    <Check className="ml-auto h-3 w-3 opacity-50" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ))}

            {pairs.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                <Heart className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground font-medium">
                  No duos created yet
                </p>
                <Button variant="link" onClick={handleAddPair}>
                  Create your first duo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredParticipants.length === 0 && viewMode !== "pairs" && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">
            No cast members found matching your filters.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter([]);
            }}
            className="mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
