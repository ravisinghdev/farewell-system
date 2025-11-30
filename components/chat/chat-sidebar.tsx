"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hash, MessageSquare, Users, Trash2, Plus } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { UserSearchDialog } from "./user-search-dialog";
import { CreateChannelDialog } from "./create-channel-dialog";
import { supabaseClient } from "@/utils/supabase/client";
import {
  getChannelDetailsAction,
  getChannelsAction,
  getPendingChannelsAction,
  ChatChannel,
} from "@/app/actions/chat-actions";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AdminRequestPanel } from "./admin-request-panel";
import { ComplaintDialog } from "./complaint-dialog";
import { User } from "@/types/custom";
import { AnimatePresence, motion } from "framer-motion";

import { useFarewell } from "@/components/providers/farewell-provider";

interface ChatSidebarProps {
  channels: ChatChannel[];
  requests: ChatChannel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  // Props are now optional/unused as we use context
  farewellId?: string;
  currentUser?: User;
  isFarewellAdmin?: boolean;
}

export function ChatSidebar({
  channels: initialChannels,
  requests: initialRequests,
  selectedChannelId,
  onSelectChannel,
}: ChatSidebarProps) {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;
  // Map context user to component expected user structure if needed, or just use ID
  const currentUser = {
    id: user.id,
    email: user.email || "",
    full_name: user.name,
    avatar_url: user.avatar,
    created_at: "", // Mock or unused
    updated_at: "", // Mock or unused
  } as User;

  const isFarewellAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );
  // ... state ...
  const [channels, setChannels] = useState<ChatChannel[]>(initialChannels);
  const [requests, setRequests] = useState<ChatChannel[]>(initialRequests);
  const [pendingGroups, setPendingGroups] = useState<ChatChannel[]>([]);

  // ... effects ... (keep existing effects)
  useEffect(() => {
    setChannels(initialChannels);
    setRequests(initialRequests);
  }, [initialChannels, initialRequests]);

  useEffect(() => {
    if (isFarewellAdmin) {
      import("@/app/actions/chat-actions").then(
        async ({ getPendingChannelsAction }) => {
          const groups = await getPendingChannelsAction(farewellId);
          setPendingGroups(groups);
        }
      );
    }
  }, [isFarewellAdmin, farewellId]);

  useEffect(() => {
    const channel = supabaseClient
      .channel(`user_sidebar:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          // ... existing logic ...
          if (payload.eventType === "INSERT") {
            const newMember = payload.new;
            const details = await getChannelDetailsAction(newMember.channel_id);

            if (details) {
              if (details.status === "active") {
                setChannels((prev) => {
                  if (prev.some((c) => c.id === details.id)) return prev;
                  return [details, ...prev];
                });
              } else if (details.status === "pending") {
                setRequests((prev) => {
                  if (prev.some((c) => c.id === details.id)) return prev;
                  return [details, ...prev];
                });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMember = payload.new;
            if (updatedMember.status === "active") {
              setRequests((prev) =>
                prev.filter((c) => c.id !== updatedMember.channel_id)
              );
              const details = await getChannelDetailsAction(
                updatedMember.channel_id
              );
              if (details) {
                setChannels((prev) => {
                  if (prev.some((c) => c.id === details.id)) return prev;
                  return [details, ...prev];
                });
              }
            } else if (updatedMember.status === "muted") {
              const updateList = (list: ChatChannel[]) =>
                list.map((c) =>
                  c.id === updatedMember.channel_id
                    ? { ...c, is_muted: true }
                    : c
                );
              setChannels(updateList);
              setRequests(updateList);
            } else {
              const details = await getChannelDetailsAction(
                updatedMember.channel_id
              );
              if (details) {
                const updateList = (list: ChatChannel[]) =>
                  list.map((c) => (c.id === details.id ? details : c));
                setChannels(updateList);
                setRequests(updateList);
              }
            }
          } else if (payload.eventType === "DELETE") {
            if (payload.old && payload.old.channel_id) {
              setChannels((prev) =>
                prev.filter((c) => c.id !== payload.old.channel_id)
              );
              setRequests((prev) =>
                prev.filter((c) => c.id !== payload.old.channel_id)
              );
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_channels",
        },
        async (payload) => {
          if (
            payload.new &&
            payload.old &&
            payload.new.status !== payload.old.status
          ) {
            const freshChannels = await getChannelsAction(
              farewellId,
              "primary"
            );
            const freshRequests = await getChannelsAction(
              farewellId,
              "requests"
            );
            setChannels(freshChannels);
            setRequests(freshRequests);

            if (isFarewellAdmin) {
              const groups = await getPendingChannelsAction(farewellId);
              setPendingGroups(groups);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [currentUser.id, farewellId, isFarewellAdmin]);

  // Filter channels
  const pinnedChannels = channels.filter((c) => c.is_pinned);
  const unpinnedChannels = channels.filter((c) => !c.is_pinned);

  const groups = unpinnedChannels.filter((c) => !c.is_dm);
  const dms = unpinnedChannels.filter((c) => c.is_dm);

  return (
    <div className="flex h-full flex-col bg-white/5 dark:bg-black/20 backdrop-blur-xl border-r border-white/10 dark:border-white/5 overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-between">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm"
          >
            Messages
          </motion.h2>
          <div className="flex items-center gap-2 mt-4">
            {isFarewellAdmin && <AdminRequestPanel farewellId={farewellId} />}
            <ComplaintDialog farewellId={farewellId} />
            <UserSearchDialog farewellId={farewellId} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="chats" className="flex-1 flex flex-col">
        <div className="px-6 pb-6">
          <TabsList className="w-full grid grid-cols-2 bg-black/20 p-1 rounded-2xl border border-white/5">
            <TabsTrigger
              value="chats"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md transition-all duration-300"
            >
              Chats
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md transition-all duration-300 relative"
            >
              Requests
              {(requests.length > 0 || pendingGroups.length > 0) && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-lg animate-pulse">
                  {requests.length + pendingGroups.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full px-4">
            <div className="space-y-8 pb-4">
              {/* Pinned */}
              {pinnedChannels.length > 0 && (
                <div className="space-y-3">
                  <p className="px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                    Pinned
                  </p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {pinnedChannels.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isSelected={selectedChannelId === channel.id}
                          onClick={() => onSelectChannel(channel.id)}
                          farewellId={farewellId}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Groups */}
              {groups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                      Groups
                    </p>
                    <CreateChannelDialog
                      farewellId={farewellId}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {groups.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isSelected={selectedChannelId === channel.id}
                          onClick={() => onSelectChannel(channel.id)}
                          farewellId={farewellId}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* DMs */}
              {dms.length > 0 && (
                <div className="space-y-3">
                  <p className="px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                    Direct Messages
                  </p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {dms.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isSelected={selectedChannelId === channel.id}
                          onClick={() => onSelectChannel(channel.id)}
                          farewellId={farewellId}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {channels.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center px-4"
                >
                  <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center mb-4 shadow-xl backdrop-blur-sm">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    No chats yet
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2 max-w-[150px]">
                    Start a conversation by searching for users.
                  </p>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full px-4">
            <div className="space-y-6 pb-4">
              {/* Pending Groups (Admin Only) */}
              {pendingGroups.length > 0 && (
                <div className="space-y-3">
                  <p className="px-2 text-[10px] font-bold text-yellow-500/80 uppercase tracking-[0.2em]">
                    Pending Approvals
                  </p>
                  <div className="space-y-2">
                    {pendingGroups.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isSelected={selectedChannelId === channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                        farewellId={farewellId}
                        isPendingApproval
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Message Requests */}
              {requests.length > 0 && (
                <div className="space-y-3">
                  <p className="px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                    Message Requests
                  </p>
                  <div className="space-y-2">
                    {requests.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isSelected={selectedChannelId === channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                        farewellId={farewellId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {requests.length === 0 && pendingGroups.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center px-4"
                >
                  <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center mb-4 shadow-xl backdrop-blur-sm">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    No new requests
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2 max-w-[150px]">
                    Message requests and group approvals will appear here.
                  </p>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelItem({
  channel,
  isSelected,
  onClick,
  farewellId,
  isPendingApproval,
}: {
  channel: ChatChannel;
  isSelected: boolean;
  onClick: () => void;
  farewellId: string;
  isPendingApproval?: boolean;
}) {
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this channel?")) return;

    try {
      const { deleteChannelAction } = await import(
        "@/app/actions/chat-actions"
      );
      const result = await deleteChannelAction(channel.id, farewellId);

      if (result.success) {
        toast.success("Channel deleted");
      } else {
        toast.error(result.error || "Failed to delete channel");
      }
    } catch (error) {
      console.error("Failed to delete channel:", error);
      toast.error("Failed to delete channel");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.button
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={cn(
            "w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden text-left",
            isSelected
              ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 shadow-lg border border-indigo-500/30"
              : "hover:bg-white/5 border border-transparent hover:border-white/5"
          )}
          onClick={onClick}
        >
          {isSelected && (
            <motion.div
              layoutId="active-channel-indicator"
              className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}

          <div className="relative z-10 flex items-center gap-4 w-full">
            {channel.is_dm ? (
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white/10 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <AvatarImage src={channel.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                    {getInitials(channel.name || "")}
                  </AvatarFallback>
                </Avatar>
                {/* Online Indicator (Mockup) */}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-black shadow-sm" />
              </div>
            ) : (
              <div
                className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-white/10",
                  isSelected
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                    : "bg-white/5 text-muted-foreground"
                )}
              >
                <Hash className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p
                  className={cn(
                    "text-sm font-semibold truncate transition-colors",
                    isSelected ? "text-indigo-300" : "text-foreground/90"
                  )}
                >
                  {channel.name || "Unknown Channel"}
                </p>
                {isPendingApproval && (
                  <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/60 truncate">
                {channel.is_dm
                  ? "Click to chat"
                  : `${channel.members?.length || 0} members`}
              </p>
            </div>
          </div>
        </motion.button>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white">
        <ContextMenuItem
          className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Channel
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
