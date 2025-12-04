import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { MusicList } from "@/components/resources/music-list";
import { getMusicAction } from "@/app/actions/resource-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MusicLibraryPage({ params }: PageProps) {
  const { id } = await params;
  const music = await getMusicAction(id);

  return (
    <PageScaffold
      title="Music & Backgrounds"
      description="Curated playlist for the event and videos."
    >
      <MusicList farewellId={id} initialMusic={music} />
    </PageScaffold>
  );
}
