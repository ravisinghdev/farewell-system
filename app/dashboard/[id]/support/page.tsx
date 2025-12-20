import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { SupportTicketList } from "@/components/community/support-ticket-list";
import { CreateTicketDialog } from "@/components/community/create-ticket-dialog";
import { SupportChat } from "@/components/community/support-chat";
import { getTicketsAction } from "@/app/actions/support-actions";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { SupportPageClient } from "./support-page-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ticket?: string }>;
}

export default async function SupportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { ticket: ticketId } = await searchParams;
  const tickets = await getTicketsAction(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current user role
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", id)
    .eq("user_id", user?.id)
    .single();

  const isAdmin = checkIsAdmin(member?.role);

  // If ticketId is present, we find that specific ticket to pass to client
  // so it can show the chat immediately if needed.
  const selectedTicket = tickets.find((t) => t.id === ticketId) || null;

  return (
    <PageScaffold
      title="Support Team"
      description="Get help with the platform or event queries."
      action={<CreateTicketDialog farewellId={id} />}
    >
      <SupportPageClient
        farewellId={id}
        initialTickets={tickets}
        initialSelectedTicket={selectedTicket}
        currentUserId={user?.id || ""}
        isAdmin={isAdmin}
      />
    </PageScaffold>
  );
}
