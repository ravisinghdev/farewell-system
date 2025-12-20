import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { ResourceFeed } from "@/components/resources/resource-feed";
import { getResourcesAction } from "@/app/actions/resource-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DownloadsPage({ params }: PageProps) {
  const { id } = await params;
  const downloads = await getResourcesAction(id, "download");

  return (
    <PageScaffold
      title="Downloads"
      description="Important documents and files."
    >
      <ResourceFeed
        farewellId={id}
        type="download"
        initialResources={downloads as any}
      />
    </PageScaffold>
  );
}
