"use client";

import { useState } from "react";
import { SupportTicketList } from "@/components/community/support-ticket-list";
import { SupportChat } from "@/components/community/support-chat";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SupportPageClientProps {
  farewellId: string;
  initialTickets: any[];
  initialSelectedTicket: any;
  currentUserId: string;
  isAdmin: boolean;
}

export function SupportPageClient({
  farewellId,
  initialTickets,
  initialSelectedTicket,
  currentUserId,
  isAdmin,
}: SupportPageClientProps) {
  // If we have a selected ticket, we show chat on mobile, or side-by-side on desktop.
  // For simplicity:
  // Desktop: Two columns (List | Chat)
  // Mobile: If ticket selected, show Chat (with back button). If not, show List.

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialSelectedTicket?.id || null
  );

  // Keep local state of tickets to pass down updated object to chat header if needed
  // (In a real app, React Query or Context is better, but passing initialTickets is fine for now)
  const selectedTicket =
    initialTickets.find((t) => t.id === selectedTicketId) ||
    initialSelectedTicket;

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    // update URL without refresh
    router.replace(`${pathname}?ticket=${id}`);
  };

  const handleBack = () => {
    setSelectedTicketId(null);
    router.replace(pathname);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[650px]">
      {/* List Column */}
      <div
        className={`w-full md:w-1/3 ${
          selectedTicketId ? "hidden md:block" : "block"
        }`}
      >
        <SupportTicketList
          farewellId={farewellId}
          initialTickets={initialTickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={handleSelectTicket}
        />
      </div>

      {/* Chat Column */}
      <div
        className={`w-full md:w-2/3 ${
          selectedTicketId ? "block" : "hidden md:block"
        }`}
      >
        {selectedTicketId && selectedTicket ? (
          <div className="h-full flex flex-col">
            <Button
              variant="ghost"
              className="mb-2 md:hidden w-fit px-0 hover:bg-transparent"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
            </Button>
            <SupportChat
              key={selectedTicketId} // force remount on change
              ticketId={selectedTicketId}
              initialTicket={selectedTicket}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        ) : (
          <div className="h-full border rounded-lg bg-muted/20 flex flex-col items-center justify-center text-muted-foreground">
            <p>Select a ticket to view conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
