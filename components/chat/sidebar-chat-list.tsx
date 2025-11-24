"use client";

import { useEffect, useState } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MessageSquare,
  ChevronRight,
  Hash,
  Users,
  Plus,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getChannelsAction,
  getChannelDetailsAction,
  ChatChannel,
} from "@/app/actions/chat-actions";
import { supabaseClient } from "@/utils/supabase/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSearchDialog } from "./user-search-dialog";

interface SidebarChatListProps {
  farewellId: string;
  currentUserId: string;
}

export function SidebarChatList({
  farewellId,
  currentUserId,
}: SidebarChatListProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [requests, setRequests] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Initial Fetch
  useEffect(() => {
    async function fetchChannels() {
      try {
        const [primaryData, requestsData] = await Promise.all([
          getChannelsAction(farewellId, "primary"),
          getChannelsAction(farewellId, "requests"),
        ]);
        setChannels(primaryData);
        setRequests(requestsData);
      } catch (error) {
        console.error("Failed to fetch channels", error);
      } finally {
        setLoading(false);
      }
    }
    if (farewellId && currentUserId) {
      fetchChannels();
    }
  }, [farewellId, currentUserId]);

  // Realtime Subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabaseClient
      .channel(`sidebar-global:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          console.log("Realtime Event:", payload);
          if (payload.eventType === "INSERT") {
            const newMember = payload.new;
            console.log("New Member Inserted:", newMember);
            const details = await getChannelDetailsAction(newMember.channel_id);
            console.log("Channel Details Fetched:", details);

            if (details) {
              if (details.status === "active") {
                setChannels((prev) => {
                  if (prev.find((c) => c.id === details.id)) return prev;
                  return [details, ...prev];
                });
              } else if (details.status === "pending") {
                console.log("Adding to Requests");
                setRequests((prev) => {
                  if (prev.find((c) => c.id === details.id)) return prev;
                  return [details, ...prev];
                });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            console.log("Member Updated:", payload.new);
            const updatedMember = payload.new;

            // Status Change (e.g. Accepted Request)
            if (updatedMember.status === "active") {
              // Check if it was in requests
              setRequests((prev) => {
                const found = prev.find(
                  (c) => c.id === updatedMember.channel_id
                );
                if (found) {
                  // Move to channels
                  getChannelDetailsAction(updatedMember.channel_id).then(
                    (details) => {
                      if (details) setChannels((curr) => [details, ...curr]);
                    }
                  );
                  return prev.filter((c) => c.id !== updatedMember.channel_id);
                }
                return prev;
              });
            }

            // Update pin/mute in both lists
            const updateList = (list: ChatChannel[]) =>
              list.map((c) =>
                c.id === updatedMember.channel_id
                  ? {
                      ...c,
                      is_pinned: updatedMember.is_pinned,
                      is_muted: updatedMember.is_muted,
                    }
                  : c
              );

            setChannels((prev) => updateList(prev));
            setRequests((prev) => updateList(prev));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [currentUserId]);

  const pinned = channels.filter((c) => c.is_pinned);
  const unpinned = channels.filter((c) => !c.is_pinned);
  const groups = unpinned.filter((c) => !c.is_dm);
  const dms = unpinned.filter((c) => c.is_dm);

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Messages</SidebarGroupLabel>
        <div className="px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>
            Messages
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {/* Action: New Chat */}
            <SidebarMenuItem>
              <UserSearchDialog
                farewellId={farewellId}
                trigger={
                  <SidebarMenuButton>
                    <Plus className="h-4 w-4" />
                    <span>New Message</span>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>

            {/* Requests */}
            {requests.length > 0 && (
              <>
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs font-medium text-red-500 flex items-center justify-between">
                    <span>Requests</span>
                    <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                      {requests.length}
                    </span>
                  </div>
                </SidebarMenuItem>
                {requests.map((channel) => (
                  <ChatMenuItem
                    key={channel.id}
                    channel={channel}
                    farewellId={farewellId}
                    pathname={pathname}
                    isRequest
                  />
                ))}
              </>
            )}

            {/* Pinned */}
            {pinned.length > 0 && (
              <>
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70">
                    Pinned
                  </div>
                </SidebarMenuItem>
                {pinned.map((channel) => (
                  <ChatMenuItem
                    key={channel.id}
                    channel={channel}
                    farewellId={farewellId}
                    pathname={pathname}
                  />
                ))}
              </>
            )}

            {/* Groups */}
            {groups.length > 0 && (
              <>
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70">
                    Groups
                  </div>
                </SidebarMenuItem>
                {groups.map((channel) => (
                  <ChatMenuItem
                    key={channel.id}
                    channel={channel}
                    farewellId={farewellId}
                    pathname={pathname}
                  />
                ))}
              </>
            )}

            {/* DMs */}
            {dms.length > 0 && (
              <>
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70">
                    Direct Messages
                  </div>
                </SidebarMenuItem>
                {dms.map((channel) => (
                  <ChatMenuItem
                    key={channel.id}
                    channel={channel}
                    farewellId={farewellId}
                    pathname={pathname}
                  />
                ))}
              </>
            )}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function ChatMenuItem({
  channel,
  farewellId,
  pathname,
  isRequest,
}: {
  channel: ChatChannel;
  farewellId: string;
  pathname: string;
  isRequest?: boolean;
}) {
  const href = `/dashboard/${farewellId}/messages?channel=${channel.id}`;
  const isActive =
    pathname === href ||
    (pathname.includes("/messages") && pathname.includes(channel.id));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={channel.name || "Chat"}
        className={
          isRequest ? "text-red-500 hover:text-red-600 hover:bg-red-50" : ""
        }
      >
        <Link href={href}>
          {channel.is_dm ? (
            <Avatar className="h-4 w-4 mr-2">
              <AvatarImage src={channel.avatar_url || ""} />
              <AvatarFallback className="text-[9px]">
                {channel.name?.[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Hash className="mr-2 h-4 w-4" />
          )}
          <span className={isRequest ? "font-medium" : ""}>
            {channel.name || "Unknown"}
          </span>
          {isRequest && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
