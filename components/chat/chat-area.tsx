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
} from "@/app/actions/chat-actions";
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
  Pin,
  PinOff,
  BellOff,
  Pencil,
  Trash2,
  Smile,
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
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string | null;
  created_at: string | null;
  user_id: string | null;
  user: User | null;
  is_deleted?: boolean;
  edited_at?: string | null;
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
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !editingMessageId) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, editingMessageId, typingUsers]);

  // Realtime
  useEffect(() => {
    const channel = supabaseClient
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to ALL events (Insert, Update)
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
            const messageWithUser = { ...newMessage, user: sender };
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

    supabaseClient.channel(`chat:${channelId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUser.id },
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const content = inputValue;
    setInputValue("");

    const formData = new FormData();
    formData.append("content", content);
    formData.append("channelId", channelId);

    startTransition(async () => {
      const result = await sendMessageAction(formData);
      if (result?.error) {
        toast.error("Failed to send message");
        setInputValue(content);
      }
    });
  };

  // ... (rest of handlers: handlePin, handleRestrict, etc. - keeping them same)
  const handlePin = () => {
    startTransition(async () => {
      const res = await togglePinAction(channelId, !isPinned, farewellId);
      if (res?.error) toast.error(res.error);
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
      if (res?.error) toast.error(res.error);
      else toast.success("User restricted");
    });
  };

  const handleBlock = () => {
    if (!otherUserId) return;
    if (!confirm("Block this user? They won't be able to message you.")) return;
    startTransition(async () => {
      const res = await blockUserAction(otherUserId);
      if (res?.error) toast.error(res.error);
      else toast.success("User blocked");
    });
  };

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptRequestAction(channelId, farewellId);
      if (res?.error) toast.error(res.error);
      else toast.success("Request accepted");
    });
  };

  const handleDeleteRequest = () => {
    if (!confirm("Delete this request?")) return;
    startTransition(async () => {
      const res = await deleteRequestAction(channelId, farewellId);
      if (res?.error) toast.error(res.error);
      else toast.success("Request deleted");
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
      if (res?.error) toast.error(res.error);
    });
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    startTransition(async () => {
      const res = await deleteMessageAction(msgId, farewellId);
      if (res?.error) toast.error(res.error);
    });
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm relative">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
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
            </div>
            {isRequest && (
              <span className="text-xs text-yellow-600 font-medium">
                Message Request
              </span>
            )}
          </div>
        </div>

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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-4">
          {messages.map((msg, index) => {
            const isMe = msg.user_id === currentUser.id;
            const showAvatar =
              index === 0 || messages[index - 1].user_id !== msg.user_id;

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
                      {msg.user?.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isMe && !showAvatar && <div className="w-8" />}

                <ContextMenu>
                  <ContextMenuTrigger>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl p-3.5 text-sm relative shadow-sm transition-all",
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
                          </div>
                        </>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  {isMe && !editingMessageId && (
                    <ContextMenuContent className="w-40">
                      <ContextMenuItem onClick={() => startEdit(msg)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  )}
                </ContextMenu>
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
              <span>Someone is typing...</span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Footer / Input */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t">
        {isRequest ? (
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
