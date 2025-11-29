"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChatMember } from "@/app/actions/chat-actions";
import { Message, User } from "../chat-types";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  channelMembers: ChatMember[];
  onLoadMore: () => void;
  isLoadingMore: boolean;
  onReaction: (msgId: string, emoji: string) => void;
  onEdit: (msgId: string, content: string) => void;
  onDelete: (msgId: string) => void;
  onReply: (msg: Message) => void;
  typingUsers: Set<string>;
  isGroup: boolean;
}

export function MessageList({
  messages,
  currentUser,
  channelMembers,
  onLoadMore,
  isLoadingMore,
  onReaction,
  onEdit,
  onDelete,
  onReply,
  typingUsers,
  isGroup,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on initial load or new message (if near bottom)
  useEffect(() => {
    if (scrollRef.current && !isLoadingMore) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingUsers]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && !isLoadingMore) {
      onLoadMore();
    }
  };

  return (
    <ScrollArea className="flex-1 p-4" onScrollCapture={handleScroll}>
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="space-y-6 pb-4">
        {messages.map((msg, index) => {
          const isMe = msg.user_id === currentUser.id;
          const showAvatar =
            index === 0 || messages[index - 1].user_id !== msg.user_id;

          return (
            <MessageItem
              key={msg.id}
              message={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              onEdit={onEdit}
              onDelete={onDelete}
              onReaction={onReaction}
              currentUserId={currentUser.id}
              channelMembers={channelMembers}
              isGroup={isGroup}
              onReply={onReply}
            />
          );
        })}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex gap-2 items-center text-xs text-muted-foreground animate-pulse ml-12">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce delay-0" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce delay-150" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce delay-300" />
            </div>
            <span>
              {Array.from(typingUsers)
                .map((id) => {
                  const member = channelMembers.find((m) => m.user_id === id);
                  return member?.user?.full_name || "Someone";
                })
                .join(", ")}{" "}
              is typing...
            </span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
