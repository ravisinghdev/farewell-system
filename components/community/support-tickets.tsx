"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Mail, Plus, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  createSupportTicketAction,
  updateTicketStatusAction,
} from "@/app/actions/community-actions";
import { checkIsAdmin } from "@/lib/auth/roles";
import { useFarewell } from "@/components/providers/farewell-provider";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "resolved" | "closed";
  created_at: string;
  user_id: string;
}

interface SupportTicketsProps {
  initialTickets: SupportTicket[];
  farewellId: string;
}

export function SupportTickets({
  initialTickets,
  farewellId,
}: SupportTicketsProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("support_tickets_changes")
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
            // Only add if admin or if it's my ticket (though RLS handles this, client side filter is good too)
            // For simplicity, we just add it. RLS prevents receiving events for others if configured correctly,
            // but Supabase Realtime broadcasts to all subscribers of the channel unless using RLS with Realtime (which is enabled).
            setTickets((prev) => [payload.new as SupportTicket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as SupportTicket) : t
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase]);

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    const result = await createSupportTicketAction(farewellId, {
      subject,
      message,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Ticket submitted successfully");
      setIsDialogOpen(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const result = await updateTicketStatusAction(id, farewellId, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status updated");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column: Contact Options */}
      <div className="space-y-6">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Contact Support</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Facing issues? Submit a ticket and our team will help you out.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Submit New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Support Ticket</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    required
                    placeholder="e.g. Login Issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    placeholder="Describe your issue..."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Direct Contact</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Email Organizers
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: My Tickets */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          {isAdmin ? "All Tickets" : "My Tickets"}
        </h3>
        {tickets.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-muted/20 text-muted-foreground">
            No tickets found.
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{ticket.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      ticket.status === "open" &&
                        "bg-yellow-500/10 text-yellow-500",
                      ticket.status === "resolved" &&
                        "bg-green-500/10 text-green-500",
                      ticket.status === "closed" &&
                        "bg-gray-500/10 text-gray-500"
                    )}
                  >
                    {ticket.status === "open" && <Clock className="h-3 w-3" />}
                    {ticket.status === "resolved" && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    <span className="capitalize">{ticket.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                  <span>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  {isAdmin && (
                    <Select
                      defaultValue={ticket.status}
                      onValueChange={(val) =>
                        handleStatusUpdate(ticket.id, val)
                      }
                    >
                      <SelectTrigger className="h-7 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
