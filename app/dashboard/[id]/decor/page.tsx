"use client";

import { useParams } from "next/navigation";
import { FreshDecorBoard } from "@/components/decor/fresh-decor-board";

export default function DecorPage() {
  const params = useParams();
  const farewellId = params.id as string;

  return (
    <div className="py-6">
      <FreshDecorBoard farewellId={farewellId} />
    </div>
  );
}
