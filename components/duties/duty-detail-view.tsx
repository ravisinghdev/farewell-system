"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Duty } from "@/types/duties";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  AlertCircle,
  History,
} from "lucide-react";
import { AssignmentDialog } from "./assignment-dialog";
import { ClaimDialog } from "./claim-dialog";
import { VerificationDialog } from "./verification-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  deleteDutyAction,
  unassignDutyAction,
} from "@/app/actions/duty-actions";

interface DutyDetailViewProps {
  initialDuty: any; // Complex type with joins
  farewellId: string;
  currentUserRole: string;
  currentUserId: string;
}

export function DutyDetailView({
  initialDuty,
  farewellId,
  currentUserRole,
  currentUserId,
}: DutyDetailViewProps) {
  const router = useRouter();
  const [duty, setDuty] = useState(initialDuty);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`duty_detail_${duty.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duties",
          filter: `id=eq.${duty.id}`,
        },
        (payload) => {
          setDuty((prev: any) => ({ ...prev, ...payload.new }));
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_assignments",
          filter: `duty_id=eq.${duty.id}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_claims",
          filter: `duty_id=eq.${duty.id}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "duty_activities",
          filter: `duty_id=eq.${duty.id}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duty.id, supabase, router]);

  // Sync state with server props if they change (e.g. from router.refresh())
  useEffect(() => {
    setDuty(initialDuty);
  }, [initialDuty]);

  const isAdmin = ["main_admin", "parallel_admin", "admin", "teacher"].includes(
    currentUserRole
  );

  const handleDelete = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDutyAction(duty.id, farewellId);
      toast.success("Duty deleted");
      router.push(`/dashboard/${farewellId}/duties`);
    } catch (e) {
      toast.error("Failed to delete duty");
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await unassignDutyAction(farewellId, duty.id, userId);
      toast.success("User unassigned");
      router.refresh();
    } catch (e) {
      toast.error("Failed to unassign user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{duty.title}</h1>
            <Badge variant="outline">{duty.category}</Badge>
            <Badge className="capitalize">
              {duty.status.replace(/_/g, " ")}
            </Badge>
            {/* Explicit Role Indicator */}
            <Badge
              variant="secondary"
              className="ml-2 border-primary/20 bg-primary/5 text-primary"
            >
              Role: {currentUserRole.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Created on{" "}
            {new Date(duty.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setIsAssignmentOpen(true)}>
              Manage Assignments
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments ({duty.duty_assignments.length})
          </TabsTrigger>
          <TabsTrigger value="claims">
            Claims & Proofs ({duty.duty_claims.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {duty.description || "No description provided."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/20 rounded-lg border">
                  <span className="text-xs text-muted-foreground uppercase font-bold">
                    Required People
                  </span>
                  <div className="text-xl font-medium mt-1">
                    {duty.min_assignees} - {duty.max_assignees}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {/* My Assignment Context - Prominent Action for Assigned User */}
          {duty.duty_assignments.some(
            (a: any) => a.user_id === currentUserId
          ) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    You are assigned to this duty
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once completed, please submit your proof/claim.
                  </p>
                </div>
              </div>
              {/* Only show if not already claimed (or allow multiple?) - assuming 1 active claim per user for now, or just show button */}
              {!duty.duty_claims.some(
                (c: any) => c.user_id === currentUserId
              ) ? (
                <Button
                  onClick={() => setIsClaimOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Upload Receipt / Submit Claim
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="text-green-600 border-green-200 bg-green-50"
                >
                  Claim Submitted
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Assigned Members</h2>
            {isAdmin && (
              <Button size="sm" onClick={() => setIsAssignmentOpen(true)}>
                <Users className="w-4 h-4 mr-2" /> Add Member
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {duty.duty_assignments.map((assignment: any) => (
              <Card
                key={assignment.user_id}
                className="flex flex-row items-center p-4 gap-4"
              >
                <Avatar>
                  <AvatarImage src={assignment.user?.avatar_url} />
                  <AvatarFallback>
                    {assignment.user?.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium truncate">
                    {assignment.user?.full_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {assignment.user?.email}
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleUnassign(assignment.user_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </Card>
            ))}
            {duty.duty_assignments.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                No users assigned yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Submitted Claims</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVerificationOpen(true)}
            >
              View Verification Board
            </Button>
          </div>

          <div className="space-y-4">
            {duty.duty_claims.map((claim: any) => (
              <Card key={claim.id}>
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={claim.user?.avatar_url} />
                          <AvatarFallback>
                            {claim.user?.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {claim.user?.full_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            claim.status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {claim.status}
                        </Badge>
                        {duty.status === "completed_pending_verification" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsVerificationOpen(true)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Vote / Verify
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {claim.description}
                    </p>
                    {claim.proof_url && (
                      <div className="mt-2">
                        <a
                          href={claim.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <Users className="w-3 h-3" /> View Proof Attachment
                        </a>
                      </div>
                    )}
                    <div className="mt-2 text-sm font-semibold">
                      Claimed: ₹{claim.claimed_amount.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {duty.duty_claims.length === 0 && (
              <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                No claims submitted yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {duty.duty_activities?.map((activity: any, i: number) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      {i !== (duty.duty_activities?.length || 0) - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className="font-medium text-sm">{activity.details}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={activity.actor?.avatar_url} />
                          <AvatarFallback>
                            {activity.actor?.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{activity.actor?.full_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      {activity.metadata && (
                        <pre className="mt-2 text-[10px] bg-muted p-2 rounded overflow-auto max-w-[300px] sm:max-w-md">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
                {(!duty.duty_activities ||
                  duty.duty_activities.length === 0) && (
                  <div className="text-muted-foreground text-sm">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssignmentDialog
        open={isAssignmentOpen}
        onOpenChange={setIsAssignmentOpen}
        dutyId={duty.id}
        farewellId={farewellId}
        currentAssignees={duty.duty_assignments.map((a: any) => a.user_id)}
        onSuccess={() => router.refresh()}
      />

      <ClaimDialog
        open={isClaimOpen}
        onOpenChange={setIsClaimOpen}
        dutyId={duty.id}
      />

      <VerificationDialog
        open={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        duty={duty}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
