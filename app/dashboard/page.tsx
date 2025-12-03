import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/utils/supabase/admin";

export default async function DashboardRootPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData || !claimsData.claims) {
    redirect("/auth");
  }

  const claims = claimsData.claims;
  const farewellIds = claims.farewells ? Object.keys(claims.farewells) : [];

  if (farewellIds.length > 0) {
    redirect(`/dashboard/${farewellIds[0]}`);
  }

  // Fallback: Check DB if claims are missing
  const { data: members } = await supabaseAdmin
    .from("farewell_members")
    .select("farewell_id")
    .eq("user_id", claims.sub)
    .limit(1);

  if (members && members.length > 0) {
    redirect(`/dashboard/${members[0].farewell_id}`);
  }

  redirect("/welcome");
}
