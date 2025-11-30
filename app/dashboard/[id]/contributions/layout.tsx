import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { ContributionsNav } from "@/components/contributions/contributions-nav";

export default async function ContributionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole();

  if (!user) redirect("/auth");

  return (
    <div className="min-h-screen p-2 md:p-6 font-sans">
      <ContributionsNav farewellId={id} />
      <main className="max-w-[1600px] mx-auto">{children}</main>
    </div>
  );
}
