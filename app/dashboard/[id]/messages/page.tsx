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

export default async function MessagesPage({
  params,
  searchParams,
}: MessagesPageProps) {
  const { id } = await params;
  const { channel: channelIdParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch both lists
  const channels = await getChannelsAction(id, "primary");
  const requests = await getChannelsAction(id, "requests");

  // Determine active channel
  // If param exists, use it.
  // Else if channels exist, use first channel.
  // Else if requests exist, use first request.
  const activeChannelId = channelIdParam || channels[0]?.id || requests[0]?.id;

  let messages: any[] = [];
  let activeChannel: ChatChannel | null = null;

  if (activeChannelId) {
    messages = await getMessagesAction(activeChannelId);
    const allChannels = [...channels, ...requests];
    activeChannel = allChannels.find((c) => c.id === activeChannelId) || null;
  }

  // Fetch farewell role
  const { data: farewellMember } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", id)
    .eq("user_id", user.id)
    .single();

  const isFarewellAdmin =
    farewellMember?.role === "admin" || farewellMember?.role === "main_admin";

  return (
    <ChatClientWrapper
      channels={channels}
      requests={requests}
      activeChannelId={activeChannelId}
      activeChannel={activeChannel}
      messages={messages}
      farewellId={id}
      user={{
        id: user.id,
        full_name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
      }}
      isFarewellAdmin={isFarewellAdmin}
    />
  );
}
