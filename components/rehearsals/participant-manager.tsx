"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, UserPlus, Users, X } from "lucide-react";
import {
  getFarewellMembersAction,
  updateRehearsalMetadataAction,
} from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

interface ParticipantManagerProps {
  rehearsalId: string;
  farewellId: string;
  participants: any[]; // Current participants list
  metadata: any; // Contains couples info
  isAdmin: boolean;
  performanceType?: string;
}

export function ParticipantManager({
  rehearsalId,
  farewellId,
  participants: initialParticipants,
  metadata,
  isAdmin,
  performanceType,
}: ParticipantManagerProps) {
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>(
    initialParticipants || []
  );
  const [couples, setCouples] = useState<any[]>(metadata?.couples || []);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [isPairingMode, setIsPairingMode] = useState(false);

  // Coupling State
  const [selectedForCouple, setSelectedForCouple] = useState<string | null>(
    null
  );

  // View Mode State
  const initialIsCouple =
    performanceType === "couple" ||
    performanceType === "duet" ||
    performanceType === "pair";

  const [viewMode, setViewMode] = useState<"group" | "pair">(
    initialIsCouple ? "pair" : "group"
  );

  useEffect(() => {
    if (initialIsCouple) setViewMode("pair");
  }, [performanceType]);

  const isCoupleView = viewMode === "pair";

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const members = await getFarewellMembersAction(farewellId);
    setAllMembers(members);
  }

  async function handleAddParticipant(user: any) {
    if (participants.some((p) => p.id === user.id)) return;

    const newParticipants = [...participants, user];
    await saveChanges(newParticipants, couples);
    toast.success(`${user.full_name} added to cast`);
  }

  async function handleRemoveParticipant(userId: string) {
    const newParticipants = participants.filter((p) => p.id !== userId);
    // Also remove from couples if present
    const newCouples = couples.filter(
      (c) => c.partner1.id !== userId && c.partner2.id !== userId
    );

    await saveChanges(newParticipants, newCouples);
    toast.success("Removed from cast");
  }

  async function handleCoupleClick(user: any) {
    if (!isAdmin) return;

    if (!isPairingMode) {
      if (isCoupleView) toast.info("Enable 'Pairing Mode' to link couples.");
      return;
    }

    if (!selectedForCouple) {
      // Select first partner
      setSelectedForCouple(user.id);
      toast.info(`Select partner for ${user.full_name}`);
    } else {
      if (selectedForCouple === user.id) {
        setSelectedForCouple(null); // Deselect
        return;
      }

      // Select second partner & Create Couple
      const partner1 = participants.find((p) => p.id === selectedForCouple);
      const partner2 = user;

      const newCouple = {
        id: crypto.randomUUID(),
        partner1,
        partner2,
      };

      const newCouples = [...couples, newCouple];
      await saveChanges(participants, newCouples);

      setSelectedForCouple(null);
      toast.success("❤️ Couple Paired!");
    }
  }

  async function handleBreakUp(coupleId: string) {
    const newCouples = couples.filter((c) => c.id !== coupleId);
    await saveChanges(participants, newCouples);
    toast.success("Couple un-paired");
  }

  async function saveChanges(newParticipants: any[], newCouples: any[]) {
    // Optimistic Update
    setParticipants(newParticipants);
    setCouples(newCouples);

    // Save to metadata (we are storing everything in metadata for now as requested)
    // AND participants might be stored in the 'participants' snapshot or we sync them.
    // For this implementation, we treat 'metadata' as the source of truth for UI state.
    const newMetadata = {
      ...metadata,
      participants: newParticipants, // Sync list to metadata
      couples: newCouples,
    };

    await updateRehearsalMetadataAction(rehearsalId, farewellId, newMetadata);
  }

  // Filter out already added people
  const availableMembers = allMembers.filter(
    (m) => !participants.some((p) => p.id === m.id)
  );

  return (
    <div className="space-y-8">
      {/* Control Bar */}
      {/* Admin Controls Header */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-muted/40 p-3 rounded-lg border mb-4">
          {/* Format Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              Format:
            </span>
            <div className="flex p-1 bg-background border rounded-md">
              <button
                onClick={() => setViewMode("group")}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                  viewMode === "group"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted"
                }`}
              >
                Group / Solo
              </button>
              <button
                onClick={() => setViewMode("pair")}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                  viewMode === "pair"
                    ? "bg-pink-500 text-white shadow-sm"
                    : "hover:bg-muted"
                }`}
              >
                Couples
              </button>
            </div>
          </div>

          {/* Pairing Mode Switch (Only in Pair View) */}
          {isCoupleView && (
            <div className="flex items-center space-x-2 sm:border-l sm:pl-4">
              <Switch
                id="pairing-mode"
                checked={isPairingMode}
                onCheckedChange={(checked) => {
                  setIsPairingMode(checked);
                  setSelectedForCouple(null);
                }}
              />
              <Label htmlFor="pairing-mode" className="cursor-pointer">
                <span className="font-medium">Pairing Mode</span>
              </Label>
            </div>
          )}
        </div>
      )}

      {/* 1. Couples Section (Conditional) */}
      {isCoupleView ? (
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Couples & Pairs
          </h3>

          {couples.length === 0 && (
            <div className="text-sm text-muted-foreground italic mb-4">
              No couples paired yet. Click users below to pair them.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {couples.map((couple) => (
              <Card
                key={couple.id}
                className="p-3 flex items-center justify-between bg-pink-500/5 border-pink-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <Avatar className="border-2 border-background w-10 h-10">
                      <AvatarImage src={couple.partner1.avatar_url} />
                      <AvatarFallback>
                        {couple.partner1.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background w-10 h-10">
                      <AvatarImage src={couple.partner2.avatar_url} />
                      <AvatarFallback>
                        {couple.partner2.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-sm font-medium">
                    {couple.partner1.full_name} & {couple.partner2.full_name}
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleBreakUp(couple.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-8">
          <div className="p-4 border border-dashed rounded-lg bg-muted/20 text-muted-foreground text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            Standard Group / Solo Format. (No Pairing Required)
          </div>
        </section>
      )}

      {/* 2. Cast Management */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cast ({participants.length})
          </h3>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Cast</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {availableMembers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{user.full_name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddParticipant(user)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                    {availableMembers.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No more members to add.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {participants.map((user) => (
            <Card
              key={user.id}
              className={`p-3 relative group transition-all cursor-pointer ${
                selectedForCouple === user.id
                  ? "ring-2 ring-pink-500 bg-pink-500/10"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleCoupleClick(user)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Performer</p>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveParticipant(user.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </Card>
          ))}
          {participants.length === 0 && (
            <div className="col-span-full text-center py-8 border border-dashed rounded-lg text-muted-foreground">
              Cast list empty. Add members to start pairing.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
