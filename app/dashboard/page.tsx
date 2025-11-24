import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getClaims } from "@/lib/auth/claims";

export default async function DashboardRootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const claims = getClaims(user);
  const farewellIds = claims.farewells ? Object.keys(claims.farewells) : [];

  if (farewellIds.length > 0) {
    redirect(`/dashboard/${farewellIds[0]}`);
  }

  redirect("/welcome");
}
