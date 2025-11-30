import {
  getChannelsAction,
  getMessagesAction,
  ChatChannel,
} from "@/app/actions/chat-actions";
import { ChatClientWrapper } from "./chat-client-wrapper";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface MessagesPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    channel?: string;
  }>;
}

export default async function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 backdrop-blur-sm max-w-md">
        <h1 className="text-2xl font-bold mb-2">Chat System Disabled</h1>
        <p className="text-muted-foreground">
          The chat functionality is currently unavailable. Please check back
          later or contact an administrator.
        </p>
      </div>
    </div>
  );
}
