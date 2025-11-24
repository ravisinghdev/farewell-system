import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/auth/claims";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Wallet,
  MessageCircle,
  Image as ImageIcon,
  Calendar,
} from "lucide-react";

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

  // Verify membership in this specific farewell
  const claims = getClaims(user);
  const userFarewells = claims.farewells || {};

  if (!userFarewells[id]) {
    // User is not a member of this farewell
    redirect("/welcome");
  }

  // Fetch farewell details
  const { data: farewell } = await supabase
    .from("farewells")
    .select("*")
    .eq("id", id)
    .single();

  if (!farewell) {
    return <div>Farewell not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {farewell.name} ({farewell.year})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributions</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0.00</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={`/dashboard/${id}/contributions`}>Manage</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={`/dashboard/${id}/chat`}>Open Chat</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gallery</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Photos uploaded</p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={`/dashboard/${id}/gallery`}>View Gallery</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farewell.date
                ? new Date(farewell.date).toLocaleDateString()
                : "TBD"}
            </div>
            <p className="text-xs text-muted-foreground">Days remaining</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
