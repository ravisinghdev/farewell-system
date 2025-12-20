import { createClient } from "@/utils/supabase/server";
import {
  getAnnouncementsAction,
  getDashboardStatsAction,
  getRecentTransactionsAction,
  getHighlightsAction,
} from "@/app/actions/dashboard-actions";
import { ModernDashboard } from "@/components/dashboard/modern-dashboard";
import { redirect } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch data in parallel
  const [farewellRes, announcements, stats, transactions, highlights] =
    await Promise.all([
      supabase.from("farewells").select("*").eq("id", id).single(),
      getAnnouncementsAction(id),
      getDashboardStatsAction(id),
      getRecentTransactionsAction(id),
      getHighlightsAction(id),
    ]);

  const farewell = farewellRes.data;

  if (!farewell) {
    return <div>Farewell not found.</div>;
  }

  return (
    <ModernDashboard
      initialAnnouncements={announcements}
      initialStats={stats}
      initialTransactions={transactions}
      initialHighlights={highlights}
      farewellId={id}
      farewellName={farewell.name}
      farewellDate={farewell.date}
    />
  );
}
