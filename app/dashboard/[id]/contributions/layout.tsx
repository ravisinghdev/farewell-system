import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { ContributionsNav } from "@/components/contributions/contributions-nav";
import { checkIsAdmin } from "@/lib/auth/roles";
import { PageGuard } from "@/components/auth/PageGuard";

export default async function ContributionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const isAdmin = checkIsAdmin(user.role);

  return (
    <div className="min-h-screen font-sans">
      <ContributionsNav farewellId={id} isAdmin={isAdmin} />
      <main className="w-full h-full">
        <PageGuard farewellId={id} pageKey="contributions" bypass={isAdmin}>
          {children}
        </PageGuard>
      </main>
    </div>
  );
}
