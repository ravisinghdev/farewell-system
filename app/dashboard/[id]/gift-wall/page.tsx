"use client";

import { useEffect, useState } from "react";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { GiftsList } from "@/components/legacy/gifts-list";
import { CreateGiftDialog } from "@/components/legacy/create-gift-dialog";
import { getGiftsAction } from "@/app/actions/legacy-actions";
import { useParams } from "next/navigation";

export default function GiftWallPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGiftsAction(farewellId)
      .then((data) => {
        setGifts(data || []);
      })
      .finally(() => setLoading(false));
  }, [farewellId]);

  return (
    <PageScaffold
      title="Gift & Wishes Wall"
      description="Send virtual gifts and best wishes."
      action={<CreateGiftDialog farewellId={farewellId} />}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <GiftsList initialGifts={gifts} farewellId={farewellId} />
      )}
    </PageScaffold>
  );
}
