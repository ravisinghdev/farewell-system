import { getAnnouncementsAction } from "@/app/actions/dashboard-actions";
import { CreateAnnouncementDialog } from "@/components/dashboard/create-announcement-dialog";
import { AnnouncementCard } from "@/components/dashboard/announcement-card";
import { createClient } from "@/utils/supabase/server";
import { Bell } from "lucide-react";
import { redirect } from "next/navigation";
import { getFarewellRole } from "@/lib/auth/claims";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const announcements = await getAnnouncementsAction(id);
  const role = getFarewellRole(user, id);
  const isAdmin = role === "parallel_admin" || role === "main_admin";

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated with the latest news and changes.
          </p>
        </div>
        {isAdmin && <CreateAnnouncementDialog farewellId={id} />}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No announcements yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Check back later for updates from the organizers.
                </p>
              </div>
            </div>
          ) : (
            announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
