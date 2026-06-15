import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinOrganizationAction } from "@/features/organizations/org.actions";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to signup and pass the next parameter to bring them back here
    return redirect(`/signup?next=/join/${token}`);
  }

  // Fetch the invitation to see if it's valid.
  // The 'Public: SELECT pending invitations by token' RLS policy allows this!
  const { data: invite } = await (supabase as any)
    .from("organization_invitations")
    .select("organization_id, role, email, organizations(name)")
    .eq("token", token)
    .single();

  if (!invite) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async () => { "use server"; redirect("/onboarding"); }}>
              <Button type="submit" className="w-full">Go to Dashboard</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.email && invite.email !== user.email) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Unauthorized Email</CardTitle>
            <CardDescription>
              This invitation was sent to {invite.email}, but you are logged in as {user.email}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async () => { "use server"; redirect("/onboarding"); }}>
              <Button type="submit" variant="outline" className="w-full">Go to Dashboard</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgName = Array.isArray(invite.organizations) ? invite.organizations[0]?.name : invite.organizations?.name;

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-muted">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You have been invited to join <strong>{orgName || "an organization"}</strong> as a {invite.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async () => { 
            "use server";
            const formData = new FormData();
            formData.append("inviteCode", token);
            await joinOrganizationAction(null, formData);
          }}>
            <Button type="submit" className="w-full">Accept Invitation</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
