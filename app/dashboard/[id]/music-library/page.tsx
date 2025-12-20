import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { ResourceFeed } from "@/components/resources/resource-feed";
import { getResourcesAction } from "@/app/actions/resource-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MusicLibraryPage({ params }: PageProps) {
  const { id } = await params;
  const music = await getResourcesAction(id, "music");

  return (
    <PageScaffold
      title="Music & Backgrounds"
      description="Curated playlist for the event and videos."
    >
      <ResourceFeed
        farewellId={id}
        type="music"
        initialResources={music as any}
      />
    </PageScaffold>
  );
}
