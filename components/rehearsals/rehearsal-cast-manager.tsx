"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, User, X, Check, Loader2 } from "lucide-react";
import {
  updateRehearsalMetadataAction,
  updateRehearsalDetailsAction,
} from "@/app/actions/rehearsal-actions";
import { createNotificationAction } from "@/app/actions/notification-actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

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
}

interface RehearsalCastManagerProps {
  rehearsal: any; // Full object for updates
  rehearsalId: string;
  farewellId: string;
  participants: Participant[]; // From metadata.participants
  metadata: any;
  isAdmin: boolean;
  currentUserRole?: string;
  rehearsalType?: string;
  availableUsers: any[];
}

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
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants || []
  );

  useEffect(() => {
    if (initialParticipants) {
      setParticipants(initialParticipants);
    }
  }, [initialParticipants]);
  // Derived pair mode
  const isPairMode =
    rehearsalType === "pair" ||
    rehearsalType === "couple" ||
    metadata?.is_pair ||
    participants.some((p) => p.role?.toLowerCase()?.includes("partner")) ||
    rehearsal?.title?.toLowerCase()?.includes("couple") ||
    rehearsal?.performance?.title?.toLowerCase()?.includes("couple") ||
    rehearsal?.performance?.type === "couple" ||
    rehearsal?.performance?.type === "pair";

  const [selectedRole, setSelectedRole] = useState("performer");
  const [open, setOpen] = useState(false);

  // State for available users to add
  const [availableUsers, setAvailableUsers] = useState<any[]>(
    initialAvailableUsers || []
  );

  // State for available users to add
  // Pairs State
  const [pairs, setPairs] = useState<Pair[]>([]);

  // Initialize pairs from metadata
  useEffect(() => {
    if (metadata?.pairs && Array.isArray(metadata.pairs)) {
      setPairs(metadata.pairs);
    }
  }, [metadata]);

  // Sync available users (REMOVED - passed from server)
  // useEffect(() => {
  //   async function fetchMembers() {
  //     const users = await getFarewellMembersAction(farewellId);
  //     setAvailableUsers(users);
  //   }
  //   if (isAdmin) fetchMembers();
  // }, [farewellId, isAdmin]);

  // Helper to get all used user IDs across all pairs
  const getAllPairedUserIds = () => {
    const ids = new Set<string>();
    pairs.forEach((p) => {
      if (p.partner1) ids.add(p.partner1);
      if (p.partner2) ids.add(p.partner2);
    });
    return ids;
  };

  async function handleAdd(user: any) {
    if (participants.some((p) => p.user_id === user.id)) {
      toast.error("User already in cast");
      return;
    }
    const newPerson: Participant = {
      user_id: user.id,
      name: user.full_name || "Unknown",
      role: selectedRole,
      avatar_url: user.avatar_url,
      email: user.email,
    };
    const updatedCast = [...participants, newPerson];
    saveCast(updatedCast);
    setOpen(false);
    toast.success(`${newPerson.name} added to cast`);
  }

  async function handleRemove(userId: string) {
    const updated = participants.filter((p) => p.user_id !== userId);
    await saveCast(updated);
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

  // State for adding pair loading
  const [isAddingPair, setIsAddingPair] = useState(false);

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
    } catch (error) {
      console.error(error);
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
    const newPairs = pairs.map((p) => {
      if (p.id === pairId) {
        return { ...p, [field]: userId };
      }
      return p;
    });

    setPairs(newPairs); // Optimistic

    // If both slots in this pair are filled (or one filled and one empty, we still save)
    // Actually we should save on every change to keep it realtime?
    // Yes, save on every valid selection.
    await savePairs(newPairs);

    // Notify the user if they were just added
    if (userId) {
      await createNotificationAction(
        userId,
        "New Pair Assignment",
        `You have been added to a pair in rehearsal: ${rehearsal.title}`,
        `/dashboard/${farewellId}/rehearsals/${rehearsalId}`
      );
    }
  }

  async function savePairs(newPairs: Pair[]) {
    // 1. Construct flattened participants list
    const usedIds = new Set<string>();
    const newParticipants: Participant[] = [];

    // Helper to find user details
    const getUser = (id: string) => availableUsers.find((u) => u.id === id);

    newPairs.forEach((pair, index) => {
      // Only create cast entries if BOTH partners are selected
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

    // Preserve existing non-pair participants
    // We filter out any previous participants that were part of a pair (role contains "Pair" or "Partner")
    // OR who are NOW in the new pairs (to update their role correctly)
    // BUT we must keep "Choreographer", "Lead" etc even if they were added manually.
    // However, if a user is in a pair, their role is controlled by the pair logic.

    const newPairUserIds = new Set(
      newPairs.flatMap((p) => [p.partner1, p.partner2].filter(Boolean))
    );

    // 1. Keep anyone who is NOT in a new pair
    // If they were a pair partner before but are now unassigned, revert them to "performer"
    const preservedParticipants = participants
      .map((p) => {
        const isNowInPair = newPairUserIds.has(p.user_id);
        if (isNowInPair) return null; // Replaced by new entry in newParticipants

        const isAutoRole =
          p.role.includes("Pair") && p.role.includes("Partner");
        if (isAutoRole) {
          return { ...p, role: "performer" }; // Revert to generic role
        }
        return p;
      })
      .filter((p): p is Participant => p !== null);

    const finalCast = [...preservedParticipants, ...newParticipants];

    setParticipants(finalCast);

    const result = await updateRehearsalMetadataAction(
      rehearsalId,
      farewellId,
      {
        pairs: newPairs,
        participants: finalCast,
        is_pair: true,
      }
    );

    if (result.error) {
      toast.error("Failed to save pairs: " + result.error);
    } else {
      toast.success("Pairs updated");
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {isAdmin && isPairMode && (
        <Card className="bg-transparent border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Couple / Pair Configuration
            </CardTitle>
            <Button
              onClick={handleAddPair}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={isAddingPair}
            >
              {isAddingPair ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              {isAddingPair ? "Adding..." : "Add Couple"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {pairs.map((pair, index) => (
              <div
                key={pair.id}
                className="flex items-center gap-2 p-2 border rounded-md bg-transparent"
              >
                <span className="text-xs font-mono text-muted-foreground w-6">
                  #{index + 1}
                </span>

                <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                  <Select
                    value={pair.partner1}
                    onValueChange={(val) =>
                      handleUpdatePair(pair.id, "partner1", val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-full text-left">
                      <span className="truncate block w-full">
                        <SelectValue placeholder="Partner 1" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem
                          key={u.id}
                          value={u.id}
                          disabled={
                            getAllPairedUserIds().has(u.id) &&
                            u.id !== pair.partner1
                          }
                        >
                          {u.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={pair.partner2}
                    onValueChange={(val) =>
                      handleUpdatePair(pair.id, "partner2", val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-full text-left">
                      <span className="truncate block w-full">
                        <SelectValue placeholder="Partner 2" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem
                          key={u.id}
                          value={u.id}
                          disabled={
                            getAllPairedUserIds().has(u.id) &&
                            u.id !== pair.partner2
                          }
                        >
                          {u.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemovePair(pair.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {pairs.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground italic">
                No couples added. Click 'Add Couple' to start.
              </div>
            )}

            <div className="pt-2 text-[10px] text-muted-foreground border-t">
              * Users can only be assigned to one couple.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Cast & Crew</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{participants.length} Members</Badge>
        </div>
      </div>

      {isAdmin ? (
        <div className="flex flex-col sm:flex-row gap-2 p-4 rounded-lg border items-stretch sm:items-center">
          <div className="flex-1">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  <span className="text-muted-foreground flex items-center gap-2 truncate">
                    <Search className="w-4 h-4 shrink-0" />
                    <span className="truncate">Search members to add...</span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)] sm:w-[400px]"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search students..." />
                  <CommandList>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
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
                            className={cn(isAdded && "opacity-50")}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-[10px]">
                                {(user.full_name || "?")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.full_name}
                            {isAdded && (
                              <Check className="ml-auto h-4 w-4 opacity-50" />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-full sm:w-[140px]">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="performer">Performer</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
                <SelectItem value="tech">Tech / Crew</SelectItem>
                <SelectItem value="choreographer">Choreographer</SelectItem>
                <SelectItem value="stage_manager">Stage Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
          Read-only view. You are logged in as {isAdmin ? "Admin" : "Member"}{" "}
          (Role: {currentUserRole || "Unknown"}). Contact an administrator to
          manage this list.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map((person) => (
          <div
            key={person.user_id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-transparent hover:border-primary/50 transition-colors group relative"
          >
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={person.avatar_url} />
              <AvatarFallback>
                {(person.name || "?").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {person.name}
              </p>

              {isAdmin && !person.role.startsWith("Pair") ? (
                <Select
                  value={person.role}
                  onValueChange={(val) => handleUpdateRole(person.user_id, val)}
                >
                  <SelectTrigger className="h-6 text-[10px] uppercase font-bold px-2 w-auto max-w-full mt-1 border-primary/20 bg-primary/5 focus:ring-0 focus:ring-offset-0 [&>span]:truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="performer">Performer</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                    <SelectItem value="tech">Tech / Crew</SelectItem>
                    <SelectItem value="choreographer">Choreographer</SelectItem>
                    <SelectItem value="stage_manager">Stage Manager</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                    {person.role}
                  </span>
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => handleRemove(person.user_id)}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                title="Remove from cast"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {participants.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground italic border border-dashed rounded-lg">
            <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
            No cast members added yet. Search above to build your team.
          </div>
        )}
      </div>
    </div>
  );
}
