"use client";

import { useEffect, useState } from "react";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { ThankYouList } from "@/components/legacy/thank-you-list";
import { CreateNoteDialog } from "@/components/legacy/create-note-dialog";
import { getThankYouNotesAction } from "@/app/actions/legacy-actions";
import { useParams } from "next/navigation";

export default function ThankYouPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThankYouNotesAction(farewellId)
      .then((data) => {
        setNotes(data || []);
      })
      .finally(() => setLoading(false));
  }, [farewellId]);

  return (
    <PageScaffold
      title="Thank You Notes"
      description="Express gratitude to teachers, friends, and organizers."
      action={<CreateNoteDialog farewellId={farewellId} />}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ThankYouList initialNotes={notes} farewellId={farewellId} />
      )}
    </PageScaffold>
  );
}
