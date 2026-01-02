import { createClient } from "@/lib/supabase/server";

export default async function DashboardSpecificLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate farewell exists - lightweight check
  const { data: farewell } = await supabase
    .from("farewells")
    .select("name")
    .eq("id", id)
    .single();

  if (!farewell) {
    // Optional: handle 404 or redirect
    return <>{children}</>;
  }

  return <>{children}</>;
}
