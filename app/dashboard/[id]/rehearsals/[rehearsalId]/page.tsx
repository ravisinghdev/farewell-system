"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getRehearsalByIdAction } from "@/app/actions/rehearsal-actions";
import { RehearsalHeader } from "@/components/rehearsals/rehearsal-header";
import { ParticipantManager } from "@/components/rehearsals/participant-manager";
import { SegmentManager } from "@/components/rehearsals/segment-manager";
import { SelfCheckIn } from "@/components/rehearsals/self-check-in";
import { ReadinessChecklist } from "@/components/rehearsals/readiness-checklist";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RehearsalDetailPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const rehearsalId = params.rehearsalId as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [rehearsal, setRehearsal] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getRehearsalByIdAction(rehearsalId);
      console.log("Client Fetch Result:", result);

      if (result) {
        setRehearsal(result.rehearsal);
        setCurrentUserId(result.currentUserId || "");
        console.log("State set - CurrentUserID:", result.currentUserId);
        console.log(
          "State set - Participants:",
          result.rehearsal?.participants
        );
      }
      setLoading(false);
    }
    fetchData();
  }, [rehearsalId]);

  // Realtime Subscription
  useEffect(() => {
    import("@/utils/supabase/client").then(({ createClient }) => {
      const supabase = createClient();

      const channel = supabase
        .channel(`rehearsal-room-${rehearsalId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rehearsal_participants",
            filter: `rehearsal_id=eq.${rehearsalId}`,
          },
          () => {
            getRehearsalByIdAction(rehearsalId).then((data) =>
              setRehearsal(data)
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rehearsal_segments",
            filter: `rehearsal_id=eq.${rehearsalId}`,
          },
          () => {
            getRehearsalByIdAction(rehearsalId).then((result) => {
              if (result) {
                setRehearsal(result.rehearsal);
                setCurrentUserId(result.currentUserId || "");
              }
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rehearsals",
            filter: `id=eq.${rehearsalId}`,
          },
          () => {
            getRehearsalByIdAction(rehearsalId).then((result) => {
              if (result) {
                setRehearsal(result.rehearsal);
                setCurrentUserId(result.currentUserId || "");
              }
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [rehearsalId]);

  if (loading) {
    return (
      <PageScaffold title="Loading Rehearsal..." description="Please wait">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageScaffold>
    );
  }

  if (!rehearsal) {
    return (
      <PageScaffold
        title="Rehearsal Not Found"
        description="The requested rehearsal does not exist."
      >
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">It may have been deleted.</p>
          <Button asChild>
            <Link href={`/dashboard/${farewellId}/rehearsals`}>
              Back to List
            </Link>
          </Button>
        </div>
      </PageScaffold>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-6 pt-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 pl-0 hover:bg-transparent hover:underline text-muted-foreground"
        >
          <Link href={`/dashboard/${farewellId}/rehearsals`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Rehearsals
          </Link>
        </Button>

        <RehearsalHeader
          rehearsal={rehearsal}
          farewellId={farewellId}
          isAdmin={isAdmin}
        />
      </div>

      <div className="px-6">
        {isAdmin ? (
          <Tabs defaultValue="participants" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="segments">Run of Show</TabsTrigger>
            </TabsList>

            <TabsContent value="participants">
              <ParticipantManager
                rehearsalId={rehearsalId}
                farewellId={farewellId}
                participants={rehearsal.participants || []}
                isAdmin={isAdmin}
              />
            </TabsContent>

            <TabsContent value="segments">
              <SegmentManager
                rehearsalId={rehearsalId}
                farewellId={farewellId}
                segments={rehearsal.segments || []}
                isAdmin={isAdmin}
                isLive={rehearsal.status === "ongoing"}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Participant Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rehearsal.participants?.some(
                (p: any) => p.user_id === currentUserId
              ) ? (
                <>
                  <SelfCheckIn
                    rehearsalId={rehearsalId}
                    farewellId={farewellId}
                    userId={currentUserId}
                    currentStatus={
                      rehearsal.participants?.find(
                        (p: any) => p.user_id === currentUserId
                      )?.attendance_status
                    }
                  />
                  <ReadinessChecklist
                    rehearsalId={rehearsalId}
                    farewellId={farewellId}
                    userId={currentUserId}
                    initialReadiness={
                      rehearsal.participants?.find(
                        (p: any) => p.user_id === currentUserId
                      )?.readiness_status
                    }
                  />
                </>
              ) : (
                <div className="col-span-1 md:col-span-2 p-6 border rounded-lg bg-muted/20 text-center">
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Viewer Mode
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    You are viewing this rehearsal as a non-participant.
                  </p>
                  {/* Optional: Add "Request to Join" button here later */}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Live Run of Show</h3>
              <SegmentManager
                rehearsalId={rehearsalId}
                farewellId={farewellId}
                segments={rehearsal.segments || []}
                isAdmin={isAdmin} // False
                isLive={rehearsal.status === "ongoing"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
