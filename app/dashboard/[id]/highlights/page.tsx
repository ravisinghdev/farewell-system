import { getHighlightsAction } from "@/app/actions/dashboard-actions";
import { CreateHighlightDialog } from "@/components/dashboard/create-highlight-dialog";
import { RealtimeHighlights } from "@/components/dashboard/realtime-highlights";
import { createClient } from "@/utils/supabase/server";
import { Star } from "lucide-react";
import { redirect } from "next/navigation";
import { getFarewellRole } from "@/lib/auth/claims";
import { checkIsAdmin } from "@/lib/auth/roles";

interface HighlightsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HighlightsPage({ params }: HighlightsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const highlights = await getHighlightsAction(id);
  const role = getFarewellRole(user, id);
  const isAdmin = checkIsAdmin(role);

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" fill="currentColor" />
            Highlights & Updates
          </h1>
          <p className="text-sm text-muted-foreground">
            Featured memories and important updates.
          </p>
        </div>
        {isAdmin && <CreateHighlightDialog farewellId={id} />}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {highlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Star className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No highlights yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Stay tuned for featured content and updates.
                </p>
              </div>
            </div>
          ) : (
            <RealtimeHighlights
              initialHighlights={highlights}
              farewellId={id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
