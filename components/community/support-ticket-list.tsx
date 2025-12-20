"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface SupportTicketListProps {
  farewellId: string;
  initialTickets: Ticket[];
  selectedTicketId?: string | null;
  onSelectTicket: (id: string) => void;
}

export function SupportTicketList({
  farewellId,
  initialTickets,
  selectedTicketId,
  onSelectTicket,
}: SupportTicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const supabase = createClient();

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    const channel = supabase
      .channel(`tickets:${farewellId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `farewell_id=eq.${farewellId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTickets((prev) => [payload.new as Ticket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev
                .map((t) =>
                  t.id === payload.new.id ? (payload.new as Ticket) : t
                )
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                )
            );
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "medium":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 h-[400px]">
        <MessageSquare className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h3 className="font-medium">No tickets yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create a ticket to get started.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className={cn(
              "p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 text-left",
              selectedTicketId === ticket.id
                ? "bg-muted border-primary/50 shadow-sm"
                : "bg-card"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <h4
                className={cn(
                  "font-medium line-clamp-1",
                  selectedTicketId === ticket.id && "text-primary"
                )}
              >
                {ticket.subject}
              </h4>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-[10px] h-5 px-1.5 ml-2 shrink-0",
                  getStatusColor(ticket.status)
                )}
              >
                {ticket.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 capitalize">
                  {getPriorityIcon(ticket.priority)}
                  {ticket.priority}
                </span>
                <span>•</span>
                <span className="capitalize">{ticket.category}</span>
              </div>
              <span>
                {formatDistanceToNow(new Date(ticket.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
