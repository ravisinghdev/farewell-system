"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { supabaseClient } from "@/utils/supabase/client";
import {
  sendMessageAction,
  acceptRequestAction,
  deleteRequestAction,
  blockUserAction,
  togglePinAction,
  restrictUserAction,
  editMessageAction,
  deleteMessageAction,
  addReactionAction,
  removeReactionAction,
  markMessageSeenAction,
  sendTypingAction,
  getPublicKeyAction,
  approveChannelAction,
  deleteChannelAction,
  ChatMember,
} from "@/app/actions/chat-actions";
import { useE2EE } from "./e2ee-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Loader2,
  MoreVertical,
  Ban,
  Check,
  X,
  Lock,
  Pin,
  PinOff,
  BellOff,
  Pencil,
  Trash2,
  Smile,
  CheckCheck,
  Paperclip,
  Reply,
  FileIcon,
  Users,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn, getInitials } from "@/lib/utils";

import { GroupInfoDialog } from "./group-info-dialog";

interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Reaction {
  message_id: string;
  user_id: string;
  reaction: string;
}

interface Message {
  id: string;
  content: string | null;
  created_at: string | null;
  user_id: string | null;
  user: User | null;
  is_deleted?: boolean;
  edited_at?: string | null;
  reactions?: Reaction[]; // Joined reactions

  // read_by removed from DB, computed from members last_read_at
  type?: "text" | "image" | "file" | "system";
  file_url?: string | null;
  reply_to_id?: string | null;
}

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
}

export function ChatArea({
  initialMessages,
  channelId,
  farewellId,
  currentUser,
  isRequest,
  channelName,
  otherUserId,
  isPinned,
  members = [],
  isFarewellAdmin,
  channelStatus,
}: ChatAreaProps & { members?: ChatMember[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [channelMembers, setChannelMembers] = useState<ChatMember[]>(members);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { encrypt, decrypt, isReady } = useE2EE();
  const [peerPublicKey, setPeerPublicKey] = useState<string | null>(null);

  // File & Reply State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Optimization: If I sent it and it's not encrypted (legacy or error), keep it.
            // But for now, just try decrypt.
          }

          try {
            const text = await decrypt(msg.content, peerPublicKey!);
            return { ...msg, content: text };
          } catch (e) {
            // If decryption fails, assume it's a legacy plain text message and show it as is.
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

  // Use decryptedMessages for rendering
  const displayMessages = otherUserId ? decryptedMessages : messages;

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !editingMessageId) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, editingMessageId, typingUsers]);

  // Mark unseen messages as seen on mount/update
  useEffect(() => {
    if (isRequest) return;

    // Find the latest message not sent by me
    const lastMessage = [...messages]
      .reverse()
      .find((m) => m.user_id !== currentUser.id && !m.is_deleted);

    if (lastMessage) {
      // We just mark the channel as read up to now
      markMessageSeenAction(channelId, lastMessage.id);
    }
  }, [messages, currentUser.id, channelId, isRequest]);

  // Realtime
  useEffect(() => {
    const channel = supabaseClient
      .channel(`chat:${channelId}`)
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
            // Remove from typing if message received
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
          // We can't easily filter by channel_id here since it's not on the table,
          // but we can filter by message_id if we had a list.
          // For simplicity, we listen to all reactions and filter in client or
          // rely on the fact that we are only subscribed to this channel if we
          // use a channel-specific topic, but Supabase realtime filters are table-based.
          // A better approach for scalability is to include channel_id in reactions or use RLS.
          // For now, we'll just listen and check if the message exists in our state.
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
            // payload.old only has ID usually, but for composite key it might have both.
            // We need to match by message_id and user_id (and reaction if possible)
            // Wait, DELETE payload with RLS might be tricky. Assuming we get keys.
            // Actually, for DELETE, we might only get the PK.
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === oldReaction.message_id) {
                  return {
                    ...m,
                    reactions: (m.reactions || []).filter(
                      (r) =>
                        !(
                          r.user_id === oldReaction.user_id &&
                          r.message_id === oldReaction.message_id
                        )
                    ),
                  };
                }
                return m;
              })
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_members",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updatedMember = payload.new as ChatMember;
          setChannelMembers((prev) =>
            prev.map((m) =>
              m.user_id === updatedMember.user_id
                ? { ...m, last_read_at: updatedMember.last_read_at }
                : m
            )
          );
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId !== currentUser.id) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.add(payload.payload.userId);
            return next;
          });
          // Auto-clear after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(payload.payload.userId);
              return next;
            });
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [channelId, currentUser]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleTyping = () => {
    if (typingTimeoutRef.current) return; // Throttling

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);

    sendTypingAction(channelId); // Update DB (optional, for persistence)
    supabaseClient.channel(`chat:${channelId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUser.id },
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !selectedFile) return;

    const content = inputValue;
    const file = selectedFile;
    const replyId = replyTo?.id;

    setInputValue("");
    setSelectedFile(null);
    setReplyTo(null);

    let contentToSend = content;
    if (otherUserId && peerPublicKey && content) {
      contentToSend = await encrypt(content, peerPublicKey);
    }

    const formData = new FormData();
    formData.append("content", contentToSend);
    formData.append("channelId", channelId);
    if (file) formData.append("file", file);
    if (replyId) formData.append("replyToId", replyId);

    startTransition(async () => {
      const result = await sendMessageAction(formData);
      if (result && "error" in result && result.error) {
        toast(result.error);
        setInputValue(content); // Restore on error (simple restore)
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePin = () => {
    startTransition(async () => {
      const res = await togglePinAction(channelId, !isPinned, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success(isPinned ? "Chat unpinned" : "Chat pinned");
    });
  };

  const handleRestrict = () => {
    if (
      !confirm(
        "Restrict this user? Chat will move to requests and notifications will be muted."
      )
    )
      return;
    startTransition(async () => {
      const res = await restrictUserAction(channelId, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success("User restricted");
    });
  };

  const handleBlock = () => {
    if (!otherUserId) return;
    if (!confirm("Block this user? They won't be able to message you.")) return;
    startTransition(async () => {
      const res = await blockUserAction(otherUserId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success("User blocked");
    });
  };

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptRequestAction(channelId, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success("Request accepted");
    });
  };

  const handleDeleteRequest = () => {
    if (!confirm("Delete this request?")) return;
    startTransition(async () => {
      const res = await deleteRequestAction(channelId, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success("Request deleted");
    });
  };

  const handleApproveGroup = () => {
    startTransition(async () => {
      const res = await approveChannelAction(channelId, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success("Group approved");
    });
  };

  const handleRejectGroup = () => {
    if (!confirm("Reject and delete this group?")) return;
    startTransition(async () => {
      const res = await deleteChannelAction(channelId, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
      else toast.success("Group rejected");
    });
  };

  const startEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.content || "");
  };

  const submitEdit = async () => {
    if (!editingMessageId) return;
    const id = editingMessageId;
    const content = editValue;
    setEditingMessageId(null);

    startTransition(async () => {
      const res = await editMessageAction(id, content, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
    });
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    startTransition(async () => {
      const res = await deleteMessageAction(msgId, farewellId);
      if (res && "error" in res && res.error) toast(res.error);
    });
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    // Optimistic update
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    // Find ANY existing reaction by this user
    const existingReaction = msg.reactions?.find(
      (r) => r.user_id === currentUser.id
    );

    if (existingReaction) {
      if (existingReaction.reaction === emoji) {
        // Toggle OFF (Remove)
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
        // Replace (Remove old, Add new)
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
    } else {
      // Add new
      const newReaction = {
        message_id: msgId,
        user_id: currentUser.id,
        reaction: emoji,
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, reactions: [...(m.reactions || []), newReaction] }
            : m
        )
      );
      await addReactionAction(msgId, emoji);
    }
  };

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background/80 to-muted/20 backdrop-blur-sm relative">
      {/* Header */}
      <div className="p-4 pl-12 md:pl-4 border-b flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile: Sidebar Trigger could go here if we had access to it, but SidebarTrigger is usually global */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {channelName?.[0] || "#"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-lg leading-none">
              {channelName || "Chat"}
              {isPinned && (
                <Pin className="h-3 w-3 text-primary rotate-45 fill-primary/20" />
              )}
              {otherUserId && peerPublicKey && (
                <Lock className="h-3 w-3 text-green-500" />
              )}
            </div>
            {isRequest && (
              <span className="text-xs text-yellow-600 font-medium">
                Message Request
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!otherUserId && (
            <GroupInfoDialog
              channelId={channelId}
              farewellId={farewellId}
              members={channelMembers}
              channelName={channelName || "Group Chat"}
              currentUserId={currentUser.id}
              isFarewellAdmin={isFarewellAdmin}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted"
                >
                  <Users className="h-5 w-5" />
                </Button>
              }
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handlePin}>
                {isPinned ? (
                  <PinOff className="mr-2 h-4 w-4" />
                ) : (
                  <Pin className="mr-2 h-4 w-4" />
                )}
                {isPinned ? "Unpin Chat" : "Pin Chat"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRestrict}>
                <BellOff className="mr-2 h-4 w-4" />
                Restrict
              </DropdownMenuItem>
              {otherUserId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleBlock}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Block User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-4">
          {displayMessages.map((msg, index) => {
            const isMe = msg.user_id === currentUser.id;
            const showAvatar =
              index === 0 || displayMessages[index - 1].user_id !== msg.user_id;

            // Group reactions
            const reactionCounts = (msg.reactions || []).reduce((acc, curr) => {
              acc[curr.reaction] = (acc[curr.reaction] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            if (msg.is_deleted) {
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="text-xs text-muted-foreground italic border border-dashed rounded-lg px-3 py-2 bg-muted/30">
                    Message deleted
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  isMe ? "justify-end" : "justify-start"
                } group animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {!isMe && showAvatar && (
                  <Avatar className="h-8 w-8 mt-1 shadow-sm border border-background">
                    <AvatarImage src={msg.user?.avatar_url || ""} />
                    <AvatarFallback className="bg-muted text-xs">
                      {getInitials(msg.user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isMe && !showAvatar && <div className="w-8" />}

                <div className="flex flex-col gap-1 max-w-[75%]">
                  {/* Reply Context */}
                  {msg.reply_to_id && (
                    <div
                      className={cn(
                        "text-xs flex items-center gap-1 mb-1 opacity-70",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <Reply className="h-3 w-3" />
                      <span>Replying to message</span>
                    </div>
                  )}

                  <ContextMenu>
                    <ContextMenuTrigger>
                      <div className="relative">
                        <div
                          onDoubleClick={() => handleReaction(msg.id, "❤️")}
                          className={cn(
                            "rounded-2xl p-3.5 text-sm relative shadow-sm transition-all select-none cursor-pointer active:scale-95 duration-200",
                            isMe
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                              : "bg-white dark:bg-muted/50 backdrop-blur-sm border border-border/50 rounded-tl-sm"
                          )}
                        >
                          {!isMe && showAvatar && (
                            <p className="text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wider">
                              {msg.user?.full_name}
                            </p>
                          )}

                          {/* Content Rendering */}
                          {msg.type === "image" && msg.file_url && (
                            <img
                              src={msg.file_url}
                              alt="Attachment"
                              className="rounded-lg max-w-full mb-2 border border-white/20"
                            />
                          )}
                          {msg.type === "file" && msg.file_url && (
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-black/10 rounded-lg mb-2 hover:bg-black/20 transition-colors"
                            >
                              <FileIcon className="h-4 w-4" />
                              <span className="underline">Download File</span>
                            </a>
                          )}

                          {editingMessageId === msg.id ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 text-foreground bg-background/50"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={submitEdit}
                                className="h-8 px-2"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMessageId(null)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="leading-relaxed">{msg.content}</p>
                              <div
                                className={cn(
                                  "flex items-center justify-end gap-1 mt-1 select-none",
                                  isMe
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground/70"
                                )}
                              >
                                {msg.edited_at && (
                                  <span className="text-[9px] opacity-80">
                                    (edited)
                                  </span>
                                )}
                                <p className="text-[10px] opacity-80">
                                  {msg.created_at
                                    ? format(new Date(msg.created_at), "h:mm a")
                                    : "Sending..."}
                                </p>
                                {isMe && (
                                  <span className="ml-1">
                                    {(() => {
                                      // Compute read status
                                      const readCount = channelMembers.filter(
                                        (member) =>
                                          member.user_id !== currentUser.id &&
                                          member.last_read_at &&
                                          msg.created_at &&
                                          new Date(member.last_read_at) >=
                                            new Date(msg.created_at)
                                      ).length;

                                      return readCount > 0 ? (
                                        <CheckCheck className="h-3 w-3 text-blue-200" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      );
                                    })()}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Reactions Display */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div
                            className={cn(
                              "absolute -bottom-2 z-10 flex gap-0.5",
                              isMe ? "right-0" : "left-0"
                            )}
                          >
                            <div className="bg-background/95 backdrop-blur-sm border shadow-sm rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1 h-5">
                              {Object.entries(reactionCounts).map(
                                ([emoji, count]) => (
                                  <span
                                    key={emoji}
                                    className="flex items-center"
                                  >
                                    <span>{emoji}</span>
                                    {count > 1 && (
                                      <span className="ml-0.5 font-bold text-[9px]">
                                        {count}
                                      </span>
                                    )}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <div className="flex p-2 gap-1 justify-between bg-muted/30 rounded-md mb-1">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const custom = prompt("Enter an emoji:");
                            if (custom) handleReaction(msg.id, custom);
                          }}
                          className="hover:scale-125 transition-transform text-muted-foreground hover:text-primary flex items-center justify-center w-6"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <ContextMenuSeparator />
                      {isMe && !editingMessageId && (
                        <>
                          <ContextMenuItem onClick={() => startEdit(msg)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </ContextMenuItem>
                        </>
                      )}
                      {!isMe && (
                        <ContextMenuItem onClick={() => setReplyTo(msg)}>
                          <Reply className="mr-2 h-4 w-4" /> Reply
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              </div>
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

      {/* Footer / Input */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t">
        {channelStatus === "pending" && isFarewellAdmin ? (
          <div className="flex flex-col items-center gap-3 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              This group is pending approval.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleApproveGroup}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Approve Group
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectGroup}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ) : isRequest ? (
          <div className="flex flex-col gap-3 items-center justify-center p-6 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground font-medium">
              {channelName} wants to send you a message.
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isPending}
                className="rounded-full px-6"
              >
                <Check className="mr-2 h-4 w-4" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteRequest}
                disabled={isPending}
                className="rounded-full px-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="mr-2 h-4 w-4" /> Decline
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 items-center"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <Smile className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all pl-4 pr-12 py-5"
                disabled={isPending}
              />

              {/* File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />

              {/* Reply/File Previews */}
              {(replyTo || selectedFile) && (
                <div className="absolute bottom-full left-0 w-full bg-background/90 backdrop-blur-md border-t border-x rounded-t-xl p-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 truncate">
                    {replyTo && (
                      <span className="flex items-center gap-1">
                        <Reply className="h-3 w-3" /> Replying to{" "}
                        {replyTo.user?.full_name}
                      </span>
                    )}
                    {selectedFile && (
                      <span className="flex items-center gap-1">
                        <FileIcon className="h-3 w-3" /> {selectedFile.name}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setReplyTo(null);
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={isPending || !inputValue.trim()}
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-all",
                  inputValue.trim()
                    ? "bg-primary text-primary-foreground scale-100"
                    : "bg-muted text-muted-foreground scale-90 opacity-50"
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
