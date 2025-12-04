import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { DownloadsList } from "@/components/resources/downloads-list";
import { getDownloadsAction } from "@/app/actions/resource-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DownloadsPage({ params }: PageProps) {
  const { id } = await params;
  const downloads = await getDownloadsAction(id);

  return (
    <PageScaffold
      title="Downloads"
      description="Important documents and files."
    >
      <DownloadsList farewellId={id} initialDownloads={downloads} />
    </PageScaffold>
  );
}
