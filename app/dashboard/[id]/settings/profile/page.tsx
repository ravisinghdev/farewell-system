import { redirect } from "next/navigation";
import { getUserProfileSettingsAction } from "@/app/actions/settings/user-settings-actions";
import { UserProfileSettingsForm } from "@/components/settings/forms/UserProfileSettingsForm";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  params: {
    id: string; // farewellId
  };
}

export default async function SettingsProfilePage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile data
  // We use a try-catch or safe fetch, reusing the action logic for convenience or calling service directly if we had one.
  // Using the action's logic directly via a service function is better but calling action is not recommended for data fetching in RSC usually due to serialization.
  // Let's call the action helper function we essentially wrote.

  // Actually, importing server action in RSC is fine.
  let profile;
  try {
    profile = await getUserProfileSettingsAction();
  } catch (e) {
    console.error(e);
    // If fail, likely auth issue or DB issue over HTTP?
    // Since we are server-side, we should probably extract the logic to a lib function to avoid "action" overhead if strict.
    // But for now it works.
    return <div>Error loading profile.</div>;
  }

  return (
    <div className="space-y-6">
      <UserProfileSettingsForm initialData={profile as any} />
    </div>
  );
}
