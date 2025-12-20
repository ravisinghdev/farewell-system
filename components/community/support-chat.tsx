"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, User as UserIcon, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  getTicketMessagesAction,
  sendTicketMessageAction,
  updateTicketStatusAction,
} from "@/app/actions/support-actions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
  user_id: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  farewell_id: string;
  user_id: string; // creator
}

interface SupportChatProps {
  ticketId: string;
  initialTicket: Ticket; // passed to show header info immediately
  currentUserId: string;
  isAdmin: boolean;
}

export function SupportChat({
  ticketId,
  initialTicket,
  currentUserId,
  isAdmin,
}: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ticketStatus, setTicketStatus] = useState(initialTicket.status);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Load initial messages
    getTicketMessagesAction(ticketId).then((msgs) => setMessages(msgs));

    // Subscribe to messages
    const channel = supabase
      .channel(`messages:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          setTicketStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  async function handleSend() {
    if (!newMessage.trim()) return;
    setSending(true);
    const res = await sendTicketMessageAction(ticketId, newMessage);
    setSending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      setNewMessage("");
    }
  }

  async function handleStatusChange(newStatus: string) {
    const res = await updateTicketStatusAction(ticketId, newStatus);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Status updated");
      setTicketStatus(newStatus);
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-muted/30">
        <div>
          <h3 className="font-semibold">{initialTicket.subject}</h3>
          <p className="text-xs text-muted-foreground">
            Ticket ID: {ticketId.slice(0, 8)}
          </p>
        </div>
        <div>
          {isAdmin ? (
            <Select value={ticketStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      ticketStatus === "open"
                        ? "bg-yellow-500"
                        : ticketStatus === "resolved"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    )}
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border capitalize",
                ticketStatus === "open"
                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  : ticketStatus === "resolved"
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-gray-500/10 text-gray-500 border-gray-500/20"
              )}
            >
              {ticketStatus.replace("_", " ")}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 opacity-50">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            // Staff response logic: if is_staff_reply is true, it's typically from admin/staff.
            // But we should differentiate visual style based on isMe vs The Other Party.

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[80%]",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className="h-8 w-8 mt-1 border">
                  {msg.is_staff_reply && !isMe ? (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      SP
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 opacity-70",
                      isMe ? "text-right" : "text-left"
                    )}
                  >
                    {format(new Date(msg.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/10">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              ticketStatus === "closed"
                ? "This ticket is closed."
                : "Type your message..."
            }
            className="min-h-[20px] max-h-[100px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={ticketStatus === "closed" || sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              !newMessage.trim() || ticketStatus === "closed" || sending
            }
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
