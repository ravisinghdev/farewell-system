import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/auth/claims";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Wallet,
  MessageCircle,
  Image as ImageIcon,
  Calendar,
  ArrowRight,
  Bell,
  Star,
  Users,
} from "lucide-react";
import { Countdown } from "@/components/dashboard/countdown";
import { getAnnouncementsAction } from "@/app/actions/dashboard-actions";
import { AnnouncementCard } from "@/components/dashboard/announcement-card";

interface DashboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Verify membership
  const claims = getClaims(user);
  const userFarewells = claims.farewells || {};

  if (!userFarewells[id]) {
    const { data: member } = await supabase
      .from("farewell_members")
      .select("status")
      .eq("farewell_id", id)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!member) {
      redirect("/welcome");
    }
  }

  // Fetch data in parallel
  const [farewellRes, announcements] = await Promise.all([
    supabase.from("farewells").select("*").eq("id", id).single(),
    getAnnouncementsAction(id),
  ]);

  const farewell = farewellRes.data;

  if (!farewell) {
    return <div>Farewell not found.</div>;
  }

  // Get recent announcements (top 2)
  const recentAnnouncements = announcements.slice(0, 2);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 md:p-12 text-primary-foreground shadow-xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-soft-light"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {farewell.name}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 font-medium">
              Class of {farewell.year} • Celebrating our journey together
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Link href={`/dashboard/${id}/timeline`}>
                  View Timeline <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground"
              >
                <Link href={`/dashboard/${id}/contributions`}>
                  Contribute Now
                </Link>
              </Button>
            </div>
          </div>

          {/* Countdown Card */}
          <div className="w-full max-w-sm bg-background/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="text-center mb-4">
              <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
                Countdown to Farewell
              </p>
            </div>
            {farewell.date ? (
              <Countdown targetDate={farewell.date} />
            ) : (
              <div className="text-center py-8 text-primary-foreground/60">
                Date to be announced
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Contributions"
          icon={Wallet}
          value="₹0.00"
          subtext="Total collected"
          href={`/dashboard/${id}/contributions`}
        />
        <StatsCard
          title="Messages"
          icon={MessageCircle}
          value="0"
          subtext="Unread messages"
          href={`/dashboard/${id}/messages`}
        />
        <StatsCard
          title="Gallery"
          icon={ImageIcon}
          value="0"
          subtext="Photos uploaded"
          href={`/dashboard/${id}/gallery`}
        />
        <StatsCard
          title="Members"
          icon={Users}
          value="0"
          subtext="Joined so far"
          href={`/dashboard/${id}/people`}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Recent Announcements */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Latest Announcements
            </h2>
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
              <Link href={`/dashboard/${id}/announcements`}>View All</Link>
            </Button>
          </div>

          {recentAnnouncements.length > 0 ? (
            <div className="grid gap-4">
              {recentAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>No announcements yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links / Highlights Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Highlights
            </h2>
          </div>

          <Card className="bg-gradient-to-br from-card to-muted/50 border-none shadow-md h-full">
            <CardHeader>
              <CardTitle>Don't Miss Out!</CardTitle>
              <CardDescription>
                Check out the latest updates and featured content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted aspect-video flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-20" />
              </div>
              <Button asChild className="w-full">
                <Link href={`/dashboard/${id}/highlights`}>
                  Explore Highlights
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
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
