import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrganizationAction,
  switchOrganizationAction,
} from "@/features/organizations/org.actions";
import { cookies } from "next/headers";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";
import { JoinOrganizationForm } from "@/components/organizations/join-organization-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch all memberships
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(id, name, slug)")
    .eq("user_id", user.id);

  if (memberships && memberships.length === 1) {
    console.log("Found 1 membership, attempting auto-redirect. Memberships:", JSON.stringify(memberships, null, 2));
    // Auto-select if only 1
    const org = Array.isArray(memberships[0].organizations)
      ? memberships[0].organizations[0]
      : memberships[0].organizations;
    
    console.log("Resolved org:", org);
    
    if (org) {
      // Cookies cannot be set in Server Components in Next.js.
      // The middleware handles setting the cookie when accessing the slug.
      return redirect(`/${org.slug}/dashboard`);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden p-0 shadow-lg border-0">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-100 md:min-h-150">
            <div className="p-6 md:p-8 flex flex-col justify-center bg-background">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Welcome to Farewell</h1>
                  <p className="text-balance text-muted-foreground">
                    {memberships && memberships.length > 1
                      ? "Choose an organization to continue."
                      : "Let's set up your first organization."}
                  </p>
                </div>

                {memberships && memberships.length > 1 && (
                  <div className="space-y-4 w-full">
                    <div className="space-y-2">
                      {memberships.map((membership) => {
                        const org = Array.isArray(membership.organizations)
                          ? membership.organizations[0]
                          : membership.organizations;
                        return (
                          <form
                            key={org.id}
                            action={switchOrganizationAction.bind(null, org.id)}
                          >
                            <Button
                              variant="outline"
                              className="w-full justify-start h-12"
                              type="submit"
                            >
                              {org.name}
                            </Button>
                          </form>
                        );
                      })}
                    </div>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or create new
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Tabs defaultValue="create" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create</TabsTrigger>
                    <TabsTrigger value="join">Join</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="create" className="mt-4">
                    <CreateOrganizationForm
                      hasMemberships={(memberships ?? []).length > 0}
                    />
                  </TabsContent>
                  
                  <TabsContent value="join" className="mt-4">
                    <JoinOrganizationForm />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="relative hidden bg-muted md:block">
              <img
                src="/placeholder.svg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
