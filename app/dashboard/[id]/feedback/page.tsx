import { getFeedbackAction } from "@/app/actions/feedback-actions";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { createClient } from "@/utils/supabase/server";
import { MessageSquareHeart } from "lucide-react";
import { redirect } from "next/navigation";

interface FeedbackPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const feedback = await getFeedbackAction(id);

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="h-6 w-6 text-primary" />
            Feedback & Suggestions
          </h1>
          <p className="text-sm text-muted-foreground">
            We value your input! Help us make this farewell unforgettable.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <FeedbackForm farewellId={id} />

          {feedback.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {feedback.length} Submission{feedback.length !== 1 ? "s" : ""}
              </h3>
              <FeedbackList feedback={feedback} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
