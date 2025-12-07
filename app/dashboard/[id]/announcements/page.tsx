import { getAnnouncementsAction } from "@/app/actions/dashboard-actions";
import AnnouncementsClient from "@/components/dashboard/announcements-client";
import { createClient } from "@/utils/supabase/server";
import { CreateAnnouncementDialog } from "@/components/dashboard/create-announcement-dialog";

interface AnnouncementsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnnouncementsPage({
  params,
}: AnnouncementsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const announcements = await getAnnouncementsAction(id);

  return (
    <div className="flex flex-col h-full min-h-screen bg-transparent">
      {/* Header Hero */}
      <div className="flex items-center justify-between p-8 border-b border-white/5 bg-gradient-to-r from-background via-background to-transparent z-10 sticky top-0 backdrop-blur-md">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-primary">📢</span>
            Announcements
          </h1>
          <p className="text-muted-foreground ml-1">
            Stay updated with the latest news.
          </p>
        </div>
        {/* Create Dialog */}
        <CreateAnnouncementDialog farewellId={id} />
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-10">
        <div className="max-w-6xl mx-auto">
          <AnnouncementsClient announcements={announcements} />
        </div>
      </div>
    </div>
  );
}
