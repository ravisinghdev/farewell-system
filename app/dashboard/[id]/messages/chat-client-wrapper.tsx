"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { ChatChannel, getMessagesAction } from "@/app/actions/chat-actions";
import { MessageSquarePlus } from "lucide-react";
import { E2EEProvider } from "@/components/chat/e2ee-provider";
import { useEffect, useState, useTransition } from "react";

interface ChatClientWrapperProps {
  channels: ChatChannel[];
  requests: ChatChannel[];
  activeChannelId: string;
  activeChannel: ChatChannel | null;
  messages: any[]; // We can refine this if we export Message type
  farewellId: string;
  user: any;
  isFarewellAdmin?: boolean;
}

export function ChatClientWrapper({
  channels,
  requests,
  activeChannelId: initialActiveChannelId,
  activeChannel: initialActiveChannel,
  messages: initialMessages,
  farewellId,
  user,
  isFarewellAdmin,
}: ChatClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Client-side state for active channel and messages
  const [activeChannelId, setActiveChannelId] = useState(
    initialActiveChannelId
  );
  const [activeChannel, setActiveChannel] = useState(initialActiveChannel);
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, startTransition] = useTransition();

  // Sync with props if they change (e.g. initial load or deep link)
  // But be careful not to overwrite client navigation
  useEffect(() => {
    // Only sync if the prop ID is different from current state AND it matches the URL param
    // This handles browser back/forward buttons
    const paramId = searchParams.get("channel");
    if (paramId && paramId !== activeChannelId) {
      setActiveChannelId(paramId);
      // We might need to fetch messages here if we rely on props for initial only
      // But usually props update on navigation.
      // If we use router.push, props update.
      // If we use pushState, props DON'T update.
    }
  }, [searchParams]);

  const handleChannelSelect = (channelId: string) => {
    if (channelId === activeChannelId) return;

    startTransition(async () => {
      // 1. Update State
      setActiveChannelId(channelId);

      // 2. Find channel details
      const allChannels = [...channels, ...requests];
      const channel = allChannels.find((c) => c.id === channelId) || null;
      setActiveChannel(channel);

      // 3. Fetch Messages
      const newMessages = await getMessagesAction(channelId);
      setMessages(newMessages);

      // 4. Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set("channel", channelId);
      window.history.pushState({}, "", url.toString());
    });
  };

  // Determine if active channel is a request
  const isRequest = requests.some((r) => r.id === activeChannelId);

  // Get other user ID for blocking (if DM)
  let otherUserId = undefined;
  if (activeChannel?.is_dm && activeChannel.members) {
    const otherMember = activeChannel.members.find(
      (m: any) => m.user_id !== user.id
    );
    otherUserId = otherMember?.user_id;
  }

  return (
    <E2EEProvider currentUserId={user.id}>
      <ChatLayout
        sidebar={
          <ChatSidebar
            channels={channels}
            requests={requests}
            selectedChannelId={activeChannelId}
            onSelectChannel={handleChannelSelect}
            farewellId={farewellId}
            currentUser={user}
            isFarewellAdmin={isFarewellAdmin}
          />
        }
      >
        <div className="h-full flex flex-col">
          {activeChannelId && activeChannel ? (
            <ChatArea
              key={activeChannelId} // Force re-mount on channel change to reset internal state
              initialMessages={messages}
              channelId={activeChannelId}
              farewellId={farewellId}
              currentUser={user}
              isRequest={isRequest}
              channelName={activeChannel.name || "Chat"}
              otherUserId={otherUserId}
              isPinned={activeChannel.is_pinned}
              members={activeChannel.members}
              isFarewellAdmin={isFarewellAdmin}
              channelStatus={activeChannel.status}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <div className="p-4 rounded-full bg-muted/50">
                <MessageSquarePlus className="h-8 w-8 opacity-50" />
              </div>
              <p>Select a chat from the sidebar to start messaging.</p>
            </div>
          )}
        </div>
      </ChatLayout>
    </E2EEProvider>
  );
}
