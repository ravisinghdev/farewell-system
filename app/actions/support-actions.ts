"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Support Tickets ---

export async function getTicketsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
  return data;
}

export async function createTicketAction(
  farewellId: string,
  data: {
    subject: string;
    category: string;
    message: string;
    priority?: string;
  }
): Promise<ActionState<{ ticketId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // 1. Create Ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      farewell_id: farewellId,
      user_id: user.id,
      subject: data.subject,
      category: data.category,
      priority: data.priority || "medium",
      status: "open",
    })
    .select()
    .single();

  if (ticketError) return { error: ticketError.message };

  // 2. Create Initial Message
  const { error: messageError } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: ticket.id,
      user_id: user.id,
      message: data.message,
      is_staff_reply: false,
    });

  if (messageError) {
    return {
      error: "Ticket created but message failed: " + messageError.message,
    };
  }

  revalidatePath(`/dashboard/${farewellId}/support`);
  return { success: true, data: { ticketId: ticket.id } };
}

export async function getTicketMessagesAction(ticketId: string) {
  const supabase = await createClient();

  // We try to fetch messages. Note: Joining auth.users usually requires specific permissions or views.
  // We'll return messages and handle user display on client or via separate user fetch if needed.
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data;
}

export async function sendTicketMessageAction(
  ticketId: string,
  message: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check role to set is_staff_reply
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("farewell_id")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { error: "Ticket not found" };

  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", ticket.farewell_id)
    .eq("user_id", user.id)
    .single();

  const isStaff =
    member && ["admin", "main_admin", "parallel_admin"].includes(member.role);

  const { error } = await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    user_id: user.id,
    message,
    is_staff_reply: !!isStaff,
  });

  if (error) return { error: error.message };

  // Touch ticket updated_at
  await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath(`/dashboard/${ticket.farewell_id}/support`);
  return { success: true };
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: string
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("farewell_id")
    .eq("id", ticketId)
    .single();

  if (ticket) revalidatePath(`/dashboard/${ticket.farewell_id}/support`);

  return { success: true };
}
