import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { SupportTickets } from "@/components/community/support-tickets";
import { getSupportTicketsAction } from "@/app/actions/community-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupportPage({ params }: PageProps) {
  const { id } = await params;
  const tickets = await getSupportTicketsAction(id);

  return (
    <PageScaffold
      title="Support Team"
      description="Get help with the platform or event queries."
    >
      <SupportTickets farewellId={id} initialTickets={tickets} />
    </PageScaffold>
  );
}
