import { getLettersAction } from "@/app/actions/letters-actions";
import { CreateLetterDialog } from "@/components/letters/create-letter-dialog";
import { LetterCard } from "@/components/letters/letter-card";
import { createClient } from "@/utils/supabase/server";
import { Mail } from "lucide-react";
import { redirect } from "next/navigation";

interface LettersPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LettersPage({ params }: LettersPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const letters = await getLettersAction(id);

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Letters to Seniors
          </h1>
          <p className="text-sm text-muted-foreground">
            Heartfelt messages and wishes for the graduating class.
          </p>
        </div>
        <CreateLetterDialog farewellId={id} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {letters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <Mail className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No letters yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Be the first to write a letter to the seniors. Share your
                memories and best wishes!
              </p>
            </div>
            <CreateLetterDialog farewellId={id} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {letters.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
