"use client";

import {
  acceptRequestAction,
  addReactionAction,
  blockUserAction,
  ChatMember,
  deleteChannelAction,
  deleteMessageAction,
  deleteRequestAction,
  editMessageAction,
  getMessagesAction,
  getPublicKeyAction,
  markMessageSeenAction,
  removeReactionAction,
  restrictUserAction,
  sendMessageAction,
  togglePinAction,
} from "@/app/actions/chat-actions";
import { supabaseClient } from "@/utils/supabase/client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useE2EE } from "./e2ee-provider";

import { ChatHeader } from "./chat-parts/chat-header";
import { ChatInput } from "./chat-parts/chat-input";
import { MessageList } from "./chat-parts/message-list";
import { Message, Reaction, User } from "./chat-types";

interface ChatAreaProps {
  initialMessages: Message[];
  channelId: string;
  farewellId: string;
  currentUser: User;
  isRequest?: boolean;
  channelName?: string;
  otherUserId?: string;
  isPinned?: boolean;
  isFarewellAdmin?: boolean;
  channelStatus?: string;
  members?: ChatMember[];
}

export function ChatArea({
  initialMessages,
  channelId,
  farewellId,
  currentUser,
  isRequest,
  channelName,
  otherUserId,
  isPinned: initialIsPinned,
  members = [],
  isFarewellAdmin,
  channelStatus,
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [channelMembers, setChannelMembers] = useState<ChatMember[]>(members);
  const [isPending, startTransition] = useTransition();
  const [isPinned, setIsPinned] = useState(initialIsPinned);

  // Infinite Scroll State
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Edit/Reply State
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { encrypt, decrypt } = useE2EE();
  const [peerPublicKey, setPeerPublicKey] = useState<string | null>(null);

  // Fetch Peer Public Key for DMs
  useEffect(() => {
    if (otherUserId) {
      getPublicKeyAction(otherUserId).then((key) => {
        if (key) setPeerPublicKey(key);
      });
    } else {
      setPeerPublicKey(null);
    }
  }, [otherUserId]);

  // Decrypt Messages
  const [decryptedMessages, setDecryptedMessages] =
    useState<Message[]>(messages);

  useEffect(() => {
    const decryptAll = async () => {
      if (!peerPublicKey && otherUserId) return;

      const decrypted = await Promise.all(
        messages.map(async (msg) => {
          if (!otherUserId) return msg;
          if (!msg.content) return msg;
          if (msg.user_id === currentUser.id && !msg.content.startsWith("ey")) {
            return msg;
          }

          try {
            const text = await decrypt(msg.content, peerPublicKey!);
            return { ...msg, content: text };
          } catch (e) {
            return msg;
          }
        })
      );
      setDecryptedMessages(decrypted);
    };

    if (otherUserId && peerPublicKey) {
      decryptAll();
    } else {
      setDecryptedMessages(messages);
    }
  }, [messages, peerPublicKey, otherUserId, decrypt, currentUser.id]);

  const displayMessages = otherUserId ? decryptedMessages : messages;

  // Mark unseen messages as seen
  useEffect(() => {
    if (isRequest) return;
    const lastMessage = [...messages]
      .reverse()
      .find((m) => m.user_id !== currentUser.id && !m.is_deleted);

    if (lastMessage) {
      markMessageSeenAction(channelId, lastMessage.id);
    }
  }, [messages, currentUser.id, channelId, isRequest]);

  // Realtime
  useEffect(() => {
    const channel = supabaseClient.channel(`chat:${channelId}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            let sender: User | null = null;
            if (newMessage.user_id === currentUser.id) {
              sender = currentUser;
            } else {
              const { data } = await supabaseClient
                .from("users")
                .select("id, full_name, avatar_url")
                .eq("id", newMessage.user_id!)
                .single();
              sender = data;
            }
            const messageWithUser = {
              ...newMessage,
              user: sender,
              reactions: [],
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, messageWithUser];
            });
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(newMessage.user_id!);
              return next;
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as Message;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_reactions",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newReaction = payload.new as Reaction;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === newReaction.message_id) {
                  return {
                    ...m,
                    reactions: [...(m.reactions || []), newReaction],
                  };
                }
                return m;
              })
            );
          } else if (payload.eventType === "DELETE") {
            const oldReaction = payload.old as Reaction;
            if (
              oldReaction.message_id &&
              oldReaction.user_id &&
              oldReaction.reaction
            ) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id === oldReaction.message_id) {
                    return {
                      ...m,
                      reactions: (m.reactions || []).filter(
                        (r) =>
                          !(
                            r.user_id === oldReaction.user_id &&
                            r.reaction === oldReaction.reaction
                          )
                      ),
                    };
                  }
                  return m;
                })
              );
            }
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const userId = payload.payload.userId;
        if (userId !== currentUser.id) {
          setTypingUsers((prev) => new Set(prev).add(userId));
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [channelId, currentUser, farewellId]);

  // Actions
  const handleSendMessage = async (content: string, file: File | null) => {
    if (!content && !file) return;

    let encryptedContent = content;
    if (otherUserId && peerPublicKey && content) {
      encryptedContent = await encrypt(content, peerPublicKey);
    }

    const formData = new FormData();
    formData.append("content", encryptedContent);
    formData.append("channelId", channelId);
    if (file) formData.append("file", file);
    if (replyTo) formData.append("replyToId", replyTo.id);

    startTransition(async () => {
      const res = await sendMessageAction(formData);
      if (res && "error" in res && res.error) toast.error(res.error);
      setReplyTo(null);
    });
  };

  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(
    null
  );

  const handleTyping = async () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: currentUser.id },
        });
      }
    }, 500);
  };

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    if (!oldestMessage) {
      setIsLoadingMore(false);
      return;
    }

    const olderMessages = await getMessagesAction(
      channelId,
      50,
      oldestMessage.created_at || undefined
    );

    if (olderMessages.length < 50) {
      setHasMore(false);
    }

    if (olderMessages.length > 0) {
      setMessages((prev) => [...(olderMessages as any), ...prev]);
    }
    setIsLoadingMore(false);
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const existing = msg.reactions?.find((r) => r.user_id === currentUser.id);
    if (existing && existing.reaction === emoji) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                reactions: (m.reactions || []).filter(
                  (r) => r.user_id !== currentUser.id
                ),
              }
            : m
        )
      );
      await removeReactionAction(msgId);
    } else {
      const newReaction = {
        message_id: msgId,
        user_id: currentUser.id,
        reaction: emoji,
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                reactions: [
                  ...(m.reactions || []).filter(
                    (r) => r.user_id !== currentUser.id
                  ),
                  newReaction,
                ],
              }
            : m
        )
      );
      await addReactionAction(msgId, emoji);
    }
  };

  const handleEdit = async (msgId: string, content: string) => {
    startTransition(async () => {
      await editMessageAction(msgId, content, farewellId);
    });
  };

  const handleDelete = async (msgId: string) => {
    if (!confirm("Delete message?")) return;
    startTransition(async () => {
      await deleteMessageAction(msgId, farewellId);
    });
  };

  // Header Actions
  const handlePin = async () => {
    await togglePinAction(channelId, !isPinned, farewellId);
    setIsPinned(!isPinned);
  };
  const handleRestrict = async () => {
    if (otherUserId) await restrictUserAction(otherUserId, farewellId);
    toast.success("User restricted");
  };
  const handleBlock = async () => {
    if (otherUserId) await blockUserAction(otherUserId);
    toast.success("User blocked");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background/80 to-muted/20 backdrop-blur-sm relative">
      <ChatHeader
        channelName={channelName}
        isPinned={isPinned}
        otherUserId={otherUserId}
        peerPublicKey={peerPublicKey}
        isRequest={isRequest}
        members={channelMembers}
        channelId={channelId}
        farewellId={farewellId}
        currentUserId={currentUser.id}
        isFarewellAdmin={isFarewellAdmin}
        onPin={handlePin}
        onRestrict={handleRestrict}
        onBlock={handleBlock}
      />

      <MessageList
        messages={displayMessages}
        currentUser={currentUser}
        channelMembers={channelMembers}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        onReaction={handleReaction}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReply={setReplyTo}
        typingUsers={typingUsers}
        isGroup={!otherUserId}
      />

      {!isRequest && (
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          isPending={isPending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}
