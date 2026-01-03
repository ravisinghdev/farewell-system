import { getAnnouncementsAction } from "@/app/actions/dashboard-actions";
import AnnouncementsClient from "@/components/dashboard/announcements-client";
import { CreateAnnouncementDialog } from "@/components/dashboard/create-announcement-dialog";
// Import provider to supply data to the client component
import { DashboardDataProvider } from "@/components/providers/dashboard-data-provider";

interface AnnouncementsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnnouncementsPage({
  params,
}: AnnouncementsPageProps) {
  const { id } = await params;

  // Fetch announcements directly here (optimized: only fetch what's needed)
  const announcements = await getAnnouncementsAction(id);

  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent">
      {/* Header Hero */}
      <div className="flex items-center justify-between sm:p-8 border-b border-white/5 z-10 sticky top-0 backdrop-blur-md">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <span className="text-primary">📢</span>
            Announcements
          </h1>
          <p className="text-muted-foreground ml-1 text-xs sm:text-base hidden sm:block">
            Stay updated with the latest news.
          </p>
        </div>
        {/* Create Dialog */}
        <CreateAnnouncementDialog farewellId={id} />
      </div>

      <div className="flex-1 pt-4 sm:p-6 overflow-hidden">
        <div className="h-full">
          {/* Provide data explicitly to this subtree */}
          <DashboardDataProvider
            farewellId={id}
            announcements={announcements}
            // Pass empty/defaults for others as this page only needs announcements
            stats={undefined as any}
            recentTransactions={[]}
            highlights={[]}
            timeline={[]}
          >
            <AnnouncementsClient />
          </DashboardDataProvider>
        </div>
      </div>
    </div>
  );
}
