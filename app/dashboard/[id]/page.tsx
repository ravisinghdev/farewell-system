import { createClient } from "@/utils/supabase/server";
import {
  getAnnouncementsAction,
  getDashboardStatsAction,
  getRecentTransactionsAction,
  getHighlightsAction,
  getFarewellDetailsAction,
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
  const [farewell, announcements, stats, transactions, highlights] =
    await Promise.all([
      getFarewellDetailsAction(id),
      getAnnouncementsAction(id),
      getDashboardStatsAction(id),
      getRecentTransactionsAction(id),
      getHighlightsAction(id),
    ]);

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
