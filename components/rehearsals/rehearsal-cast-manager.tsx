"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, User, X, Check } from "lucide-react";
import {
  updateRehearsalMetadataAction,
  getFarewellMembersAction,
} from "@/app/actions/rehearsal-actions";
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
import { cn } from "@/lib/utils";

interface Participant {
  user_id: string;
  name: string;
  role: string;
  avatar_url?: string;
  email?: string;
}

interface RehearsalCastManagerProps {
  rehearsalId: string;
  farewellId: string;
  participants: Participant[]; // From metadata.participants
  metadata: any;
  isAdmin: boolean;
  currentUserRole?: string;
}

export function RehearsalCastManager({
  rehearsalId,
  farewellId,
  participants: initialParticipants,
  metadata,
  isAdmin,
  currentUserRole,
}: RehearsalCastManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants || []
  );
  const [selectedRole, setSelectedRole] = useState("performer");
  const [open, setOpen] = useState(false);

  // State for available users to add
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all members of this farewell to allow searching/adding
    async function fetchMembers() {
      const users = await getFarewellMembersAction(farewellId);
      setAvailableUsers(users);
    }
    if (isAdmin) fetchMembers();
  }, [farewellId, isAdmin]);

  async function handleAdd(user: any) {
    // Check duplication
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
    const newMetadata = {
      ...metadata,
      participants: newCast,
    };
    await updateRehearsalMetadataAction(rehearsalId, farewellId, newMetadata);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Cast & Crew</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{participants.length} Members</Badge>
        </div>
      </div>

      {isAdmin ? (
        <div className="flex gap-2 p-4 rounded-lg border items-center">
          <div className="flex-1">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search members to add...
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px]" align="start">
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

          <div className="w-[140px]">
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

              {isAdmin ? (
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
