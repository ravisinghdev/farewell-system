"use client";

import { useRouter } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { ChatChannel } from "@/app/actions/chat-actions";
import { MessageSquarePlus } from "lucide-react";

interface ChatClientWrapperProps {
  channels: ChatChannel[];
  requests: ChatChannel[];
  activeChannelId: string;
  activeChannel: ChatChannel | null;
  messages: any[]; // We can refine this if we export Message type
  farewellId: string;
  user: any;
}

export function ChatClientWrapper({
  channels,
  requests,
  activeChannelId,
  activeChannel,
  messages,
  farewellId,
  user,
}: ChatClientWrapperProps) {
  const router = useRouter();

  const handleChannelSelect = (channelId: string) => {
    router.push(`/dashboard/${farewellId}/messages?channel=${channelId}`);
  };

  // Determine if active channel is a request
  // It is a request if it's in the requests list
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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {activeChannelId && activeChannel ? (
        <ChatArea
          key={activeChannelId}
          initialMessages={messages}
          channelId={activeChannelId}
          farewellId={farewellId}
          currentUser={user}
          isRequest={isRequest}
          channelName={activeChannel.name || "Chat"}
          otherUserId={otherUserId}
          isPinned={activeChannel.is_pinned}
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
  );
}
