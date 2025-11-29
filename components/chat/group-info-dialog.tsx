"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
  Shield,
  Trash2,
  LogOut,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  searchUsersAction,
  addMemberToChannelAction,
  removeMemberFromChannelAction,
  leaveChannelAction,
  promoteMemberAction,
  demoteMemberAction,
  ChatMember,
} from "@/app/actions/chat-actions";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import { SearchResult } from "@/types/custom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface GroupInfoDialogProps {
  channelId: string;
  farewellId: string;
  members: ChatMember[];
  channelName: string;
  currentUserId: string;
  trigger?: React.ReactNode;
  isFarewellAdmin?: boolean;
}

export function GroupInfoDialog({
  channelId,
  farewellId,
  members,
  channelName,
  currentUserId,
  trigger,
  isFarewellAdmin,
}: GroupInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentUserRole = members.find(
    (m) => m.user_id === currentUserId
  )?.role;
  const isAdmin =
    isFarewellAdmin ||
    currentUserRole === "admin" ||
    currentUserRole === "owner";

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 1) {
      startSearch(async () => {
        const users = await searchUsersAction(val, farewellId);
        const existingIds = new Set(members.map((m) => m.user_id));
        setResults(users.filter((u) => !existingIds.has(u.id)));
      });
    } else {
      setResults([]);
    }
  };

  const handleAddMember = (userId: string) => {
    startTransition(async () => {
      const res = await addMemberToChannelAction(channelId, userId, farewellId);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success("Invitation sent");
        setQuery("");
        setResults([]);
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm("Remove this member?")) return;
    startTransition(async () => {
      const res = await removeMemberFromChannelAction(
        channelId,
        userId,
        farewellId
      );
      if (res?.error) toast.error(res.error);
      else toast.success("Member removed");
    });
  };

  const handlePromote = (userId: string) => {
    startTransition(async () => {
      const res = await promoteMemberAction(channelId, userId, farewellId);
      if (res?.error) toast.error(res.error);
      else toast.success("Member promoted to admin");
    });
  };

  const handleDemote = (userId: string) => {
    startTransition(async () => {
      const res = await demoteMemberAction(channelId, userId, farewellId);
      if (res?.error) toast.error(res.error);
      else toast.success("Admin rights revoked");
    });
  };

  const handleLeaveGroup = () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    startTransition(async () => {
      const res = await leaveChannelAction(channelId, farewellId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Left group");
        setOpen(false);
        router.push(`/dashboard/${farewellId}/messages`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="ghost" size="icon">
            <Users className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        {/* Header Section */}
        <div className="bg-muted/30 p-6 flex flex-col items-center justify-center border-b">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-inner">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            {channelName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Group · {members.length} members
          </p>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="p-4 space-y-6">
            {/* Add Member Section (Admins Only) */}
            {isAdmin && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Add Participants
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={query}
                    onChange={handleSearch}
                    className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
                {results.length > 0 && (
                  <div className="border rounded-lg divide-y bg-background/50">
                    {results.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback>
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {user.full_name}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddMember(user.id)}
                          disabled={isPending}
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {members.length} Participants
              </p>
              <div className="space-y-1">
                {members.map((member) => {
                  const isMe = member.user_id === currentUserId;
                  const isMemberAdmin =
                    member.role === "admin" || member.role === "owner";

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarImage src={member.user?.avatar_url || ""} />
                          <AvatarFallback>
                            {getInitials(member.user?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            {isMe ? "You" : member.user?.full_name}
                            {isMemberAdmin && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-semibold">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.user?.email || "No status"}
                          </p>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && !isMe && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isMemberAdmin ? (
                              <DropdownMenuItem
                                onClick={() => handleDemote(member.user_id)}
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Dismiss as Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handlePromote(member.user_id)}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Group Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.user_id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove from Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exit Group */}
            <div className="pt-4 border-t">
              <Button
                variant={"ghost"}
                className="w-full justify-start pl-4 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none"
                onClick={handleLeaveGroup}
                disabled={isPending}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Exit Group
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
