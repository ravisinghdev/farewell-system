"use client";

import { useParams } from "next/navigation";
import { FreshDecorBoard } from "@/components/decor/fresh-decor-board";

export default function DecorPage() {
  const params = useParams();
  const farewellId = params.id as string;

  return (
    <div className="h-full w-full p-4 md:p-6 overflow-hidden">
      <FreshDecorBoard farewellId={farewellId} />
    </div>
  );
}
