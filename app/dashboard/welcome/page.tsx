import { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/lib/auth/roles";
import WelcomeRealtime from "./welcome-realtime";

export interface FarewellRow {
  id: string;
  name: string;
  section: string | null;
  year: number;
  requires_approval: boolean;
}

export default async function WelcomePage() {
  const supabase = await createClient();

  // current user (for role-based message)
  const { data: userResp } = await supabase.auth.getUser();
  const rawRole = (userResp?.user?.user_metadata as any)?.role as
    | UserRole
    | undefined;
  console.log("User: ", userResp?.user);
  const userRole: UserRole = rawRole ?? "student";

  const { data: farewells } = await supabase
    .from("farewells")
    .select("id, name, section, year, requires_approval")
    .order("year", { ascending: false });

  return (
    <WelcomeRealtime
      initialFarewells={(farewells ?? []) as FarewellRow[]}
      userRole={userRole}
    />
  );
}
