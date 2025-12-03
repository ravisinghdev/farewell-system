"use client";

import { useEffect, useState } from "react";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { QuotesList } from "@/components/legacy/quotes-list";
import { CreateQuoteDialog } from "@/components/legacy/create-quote-dialog";
import { getQuotesAction } from "@/app/actions/legacy-actions";
import { useParams } from "next/navigation";

export default function QuotesPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuotesAction(farewellId)
      .then((data) => {
        setQuotes(data || []);
      })
      .finally(() => setLoading(false));
  }, [farewellId]);

  return (
    <PageScaffold
      title="Best Quotes & Memories"
      description="A collection of memorable quotes and moments."
      action={<CreateQuoteDialog farewellId={farewellId} />}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <QuotesList initialQuotes={quotes} farewellId={farewellId} />
      )}
    </PageScaffold>
  );
}
