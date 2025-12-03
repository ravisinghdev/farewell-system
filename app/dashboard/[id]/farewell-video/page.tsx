"use client";

import { useEffect, useState } from "react";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { VideosList } from "@/components/legacy/videos-list";
import { CreateVideoDialog } from "@/components/legacy/create-video-dialog";
import { getVideosAction } from "@/app/actions/legacy-actions";
import { useParams } from "next/navigation";

export default function FarewellVideoPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVideosAction(farewellId)
      .then((data) => {
        setVideos(data || []);
      })
      .finally(() => setLoading(false));
  }, [farewellId]);

  return (
    <PageScaffold
      title="Farewell Film"
      description="The official farewell movie and video clips."
      action={<CreateVideoDialog farewellId={farewellId} />}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <VideosList initialVideos={videos} farewellId={farewellId} />
      )}
    </PageScaffold>
  );
}
