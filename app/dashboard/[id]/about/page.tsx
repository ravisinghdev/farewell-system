import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { AboutStats } from "@/components/community/about-stats";
import { getAboutStatsAction } from "@/app/actions/community-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AboutPage({ params }: PageProps) {
  const { id } = await params;
  const stats = await getAboutStatsAction(id);

  return (
    <PageScaffold
      title="About Farewell Project"
      description="The story behind this platform."
    >
      <AboutStats stats={stats} />
    </PageScaffold>
  );
}
