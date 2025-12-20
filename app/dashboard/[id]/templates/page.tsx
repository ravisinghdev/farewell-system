import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { ResourceFeed } from "@/components/resources/resource-feed";
import { getResourcesAction } from "@/app/actions/resource-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplatesPage({ params }: PageProps) {
  const { id } = await params;
  const templates = await getResourcesAction(id, "template");

  return (
    <PageScaffold
      title="Templates & Designs"
      description="Downloadable assets for social media and print."
    >
      <ResourceFeed
        farewellId={id}
        type="template"
        initialResources={templates as any}
      />
    </PageScaffold>
  );
}
