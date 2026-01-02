"use client";

import { ConstructionPlaceholder } from "@/components/ui/construction-placeholder";
import { PageGuard } from "@/components/auth/PageGuard";
import { useParams } from "next/navigation";

export default function MemoriesPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <PageGuard farewellId={id} pageKey="gallery">
      <ConstructionPlaceholder
        title="Memories Gallery Coming Soon"
        description="We are curating the best moments. The gallery will be live shortly!"
      />
    </PageGuard>
  );
}
