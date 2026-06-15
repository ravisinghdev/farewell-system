import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateInvitationForm } from "@/components/organizations/create-invitation-form";

export default async function MembersSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) {
    return redirect("/onboarding");
  }

  // Fetch pending invitations
  const { data: invitations } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", org.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground">Manage your organization members and invitations.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Invite Members</h2>
        <CreateInvitationForm organizationId={org.id} />
      </div>

      <div className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-semibold">Pending Invitations</h2>
        {invitations && invitations.length > 0 ? (
          <div className="border rounded-md divide-y">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{inv.email || "Anyone with link"}</div>
                  <div className="text-sm text-muted-foreground">
                    Role: {inv.role} &middot; Expires: {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs">
                  {inv.token}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        )}
      </div>
    </div>
  );
}
