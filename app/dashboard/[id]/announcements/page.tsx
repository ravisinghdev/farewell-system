import { getAnnouncementsAction } from "@/app/actions/dashboard-actions";
import AnnouncementsClient from "@/components/dashboard/announcements-client";
import { createClient } from "@/utils/supabase/server";

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

  return <AnnouncementsClient announcements={announcements} />;
}
