import { getAnnouncementsAction } from "@/app/actions/dashboard-actions";
import AnnouncementsClient from "@/components/dashboard/announcements-client";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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

  return <AnnouncementsClient announcements={announcements} />;
}
