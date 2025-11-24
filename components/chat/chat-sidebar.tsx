"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hash, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSearchDialog } from "./user-search-dialog";
import { supabaseClient } from "@/utils/supabase/client";
import { getChannelDetailsAction } from "@/app/actions/chat-actions";

// Define the Channel interface locally or import it if shared
interface Channel {
  id: string;
  name: string | null;
  type: string | null;
  avatar_url?: string | null;
  is_dm?: boolean;
  is_pinned?: boolean;
}

interface ChatSidebarProps {
  channels: Channel[];
  requests: Channel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  farewellId: string;
}

export function ChatSidebar({
  channels: initialChannels,
  requests: initialRequests,
  selectedChannelId,
  onSelectChannel,
  farewellId,
  currentUser,
}: ChatSidebarProps & { currentUser: any }) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [requests, setRequests] = useState<Channel[]>(initialRequests);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabaseClient
      .channel(`sidebar:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          console.log("Sidebar Realtime Event:", payload);

          if (payload.eventType === "INSERT") {
            // New chat or request
            const newMember = payload.new;
            // Fetch full channel details
            const channelDetails = await getChannelDetailsAction(
              newMember.channel_id
            );
            if (channelDetails) {
              if (channelDetails.status === "active") {
                setChannels((prev) => [channelDetails, ...prev]);
              } else if (channelDetails.status === "pending") {
                setRequests((prev) => [channelDetails, ...prev]);
              }
            }
          } else if (payload.eventType === "UPDATE") {
            // Status change (e.g. accepted request) or Pin/Mute
            const updatedMember = payload.new;
            const channelId = updatedMember.channel_id;

            // If status changed to active, move from requests to channels
            if (updatedMember.status === "active") {
              // Check if it was in requests
              setRequests((prev) => {
                const found = prev.find((c) => c.id === channelId);
                if (found) {
                  // Move to channels
                  getChannelDetailsAction(channelId).then((details) => {
                    if (details) {
                      setChannels((cPrev) => [details, ...cPrev]);
                    }
                  });
                  return prev.filter((c) => c.id !== channelId);
                }
                return prev;
              });
            }

            // Update Pin/Mute state in both lists
            setChannels((prev) =>
              prev.map((c) =>
                c.id === channelId
                  ? {
                      ...c,
                      is_pinned: updatedMember.is_pinned,
                      is_muted: updatedMember.is_muted,
                    }
                  : c
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [currentUser.id]);

  // Filter channels
  const pinnedChannels = channels.filter((c) => c.is_pinned);
  const unpinnedChannels = channels.filter((c) => !c.is_pinned);

  const groups = unpinnedChannels.filter((c) => !c.is_dm);
  const dms = unpinnedChannels.filter((c) => c.is_dm);

  return (
    <div className="flex h-full flex-col bg-muted/30 backdrop-blur-xl border-r border-border/50">
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm animate-pulse">
                  {requests.length}
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
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Groups */}
              {groups.length > 0 && (
                <div className="space-y-2">
                  <p className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                    Groups
                  </p>
                  <div className="space-y-1">
                    {groups.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isSelected={selectedChannelId === channel.id}
                        onClick={() => onSelectChannel(channel.id)}
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
            <div className="space-y-1 pb-4">
              {requests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No new requests</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Message requests from non-friends will appear here.
                  </p>
                </div>
              )}
              {requests.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isSelected={selectedChannelId === channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                />
              ))}
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
}: {
  channel: Channel;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
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
              {channel.name?.[0]}
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
          <p
            className={cn(
              "text-sm font-medium truncate transition-colors",
              isSelected ? "text-primary" : "text-foreground"
            )}
          >
            {channel.name || "Unknown Channel"}
          </p>
          {/* Optional: Last message preview could go here */}
        </div>
      </div>
    </Button>
  );
}
