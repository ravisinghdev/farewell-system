import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { TemplatesList } from "@/components/resources/templates-list";
import { getTemplatesAction } from "@/app/actions/resource-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplatesPage({ params }: PageProps) {
  const { id } = await params;
  const templates = await getTemplatesAction(id);

  return (
    <PageScaffold
      title="Templates & Designs"
      description="Downloadable assets for social media and print."
    >
      <TemplatesList farewellId={id} initialTemplates={templates} />
    </PageScaffold>
  );
}
