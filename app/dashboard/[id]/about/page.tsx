import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { AboutPageRenderer } from "@/components/community/about-page-renderer";
import { getAboutSectionsAction } from "@/app/actions/about-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AboutPage({ params }: PageProps) {
  const { id } = await params;
  const sections = await getAboutSectionsAction(id);

  return (
    <PageScaffold
      title="About Farewell Project"
      description="The story behind this platform."
    >
      <AboutPageRenderer sections={sections} farewellId={id} />
    </PageScaffold>
  );
}
