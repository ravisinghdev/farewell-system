import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  getAnnouncementsAction,
  getDashboardStatsAction,
  getRecentTransactionsAction,
} from "@/app/actions/dashboard-actions";
import { RealtimeDashboard } from "@/components/dashboard/realtime-dashboard";

interface DashboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch data in parallel
  const [farewellRes, announcements, stats, transactions] = await Promise.all([
    supabase.from("farewells").select("*").eq("id", id).single(),
    getAnnouncementsAction(id),
    getDashboardStatsAction(id),
    getRecentTransactionsAction(id),
  ]);

  const farewell = farewellRes.data;

  if (!farewell) {
    return <div>Farewell not found.</div>;
  }

  return (
    <RealtimeDashboard
      initialAnnouncements={announcements}
      initialStats={stats}
      initialTransactions={transactions}
      farewellId={id}
      farewellName={farewell.name}
      farewellYear={farewell.year}
      farewellDate={farewell.date}
    />
  );
}

function StatsCard({ title, icon: Icon, value, subtext, href }: any) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
