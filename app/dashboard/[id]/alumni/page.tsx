import { getAlumniMessagesAction } from "@/app/actions/alumni-actions";
import { CreateAlumniMessageDialog } from "@/components/alumni/create-alumni-message-dialog";
import { AlumniMessageCard } from "@/components/alumni/alumni-message-card";
import { createClient } from "@/utils/supabase/server";
import { UserCircle } from "lucide-react";
import { redirect } from "next/navigation";

interface AlumniPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AlumniPage({ params }: AlumniPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const messages = await getAlumniMessagesAction(id);

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            Alumni Messages
          </h1>
          <p className="text-sm text-muted-foreground">
            Words of wisdom and memories from our alumni network.
          </p>
        </div>
        <CreateAlumniMessageDialog farewellId={id} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No messages yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Be the first alumni to share a message with the graduating
                class.
              </p>
            </div>
            <CreateAlumniMessageDialog farewellId={id} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {messages.map((message) => (
              <AlumniMessageCard
                key={message.id}
                message={message}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
