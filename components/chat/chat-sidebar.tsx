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

import { User } from "@/types/custom";

interface ChatSidebarProps {
  channels: ChatChannel[];
  requests: ChatChannel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  farewellId: string;
  currentUser: User;
  isFarewellAdmin?: boolean;
}

export function ChatSidebar({
  channels: initialChannels,
  requests: initialRequests,
  selectedChannelId,
  onSelectChannel,
  farewellId,
  currentUser,
  isFarewellAdmin,
}: ChatSidebarProps) {
  const [channels, setChannels] = useState<ChatChannel[]>(initialChannels);
  const [requests, setRequests] = useState<ChatChannel[]>(initialRequests);
  const [pendingGroups, setPendingGroups] = useState<ChatChannel[]>([]);

  useEffect(() => {
    setChannels(initialChannels);
    setRequests(initialRequests);
  }, [initialChannels, initialRequests]);

  // Fetch pending groups if admin
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

  // Realtime Subscription
  // Realtime Subscription
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
        async () => {
          // Refresh channels on any membership change
          const freshChannels = await getChannelsAction(farewellId, "primary");
          const freshRequests = await getChannelsAction(farewellId, "requests");
          setChannels(freshChannels);
          setRequests(freshRequests);
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
          // If a channel status changes (e.g. pending -> active), refresh
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
    <div className="flex h-full flex-col bg-gradient-to-b from-muted/30 to-background backdrop-blur-xl border-r border-border/50">
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Messages
          </h2>
          <UserSearchDialog farewellId={farewellId} />
        </div>
      </div>

      <Tabs defaultValue="chats" className="flex-1 flex flex-col">
        <div className="px-4 pb-4">
          <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="chats"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Chats
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all relative"
            >
              Requests
              {(requests.length > 0 || pendingGroups.length > 0) && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm animate-pulse">
                  {requests.length + pendingGroups.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full px-2">
            <div className="space-y-6 pb-4">
              {/* Pinned */}
              {pinnedChannels.length > 0 && (
                <div className="space-y-2">
                  <p className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                    Pinned
                  </p>
                  <div className="space-y-1">
                    {pinnedChannels.map((channel) => (
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

              {/* Groups */}
              {groups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-4">
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                      Groups
                    </p>
                    <CreateChannelDialog
                      farewellId={farewellId}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-muted rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    {groups.map((channel) => (
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

              {/* DMs */}
              {dms.length > 0 && (
                <div className="space-y-2">
                  <p className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                    Direct Messages
                  </p>
                  <div className="space-y-1">
                    {dms.map((channel) => (
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

              {channels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No chats yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start a conversation by searching for users.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 mt-0 min-h-0">
          <ScrollArea className="h-full px-2">
            <div className="space-y-4 pb-4">
              {/* Pending Groups (Admin Only) */}
              {pendingGroups.length > 0 && (
                <div className="space-y-2">
                  <p className="px-4 text-xs font-medium text-yellow-600 uppercase tracking-widest">
                    Pending Group Approvals
                  </p>
                  <div className="space-y-1">
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
                <div className="space-y-2">
                  <p className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                    Message Requests
                  </p>
                  <div className="space-y-1">
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
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No new requests</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Message requests and group approvals will appear here.
                  </p>
                </div>
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
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-14 px-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
            isSelected
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "hover:bg-muted/60"
          )}
          onClick={onClick}
        >
          {isSelected && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
          )}
          <div className="flex items-center gap-3 w-full overflow-hidden z-10">
            {channel.is_dm ? (
              <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                <AvatarImage src={channel.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                  {getInitials(channel.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Hash className="h-4 w-4" />
              </div>
            )}

            <div className="flex-1 text-left truncate">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-sm font-medium truncate transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {channel.name || "Unknown Channel"}
                </p>
                {isPendingApproval && (
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded-full font-medium border border-yellow-500/20">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Channel
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
