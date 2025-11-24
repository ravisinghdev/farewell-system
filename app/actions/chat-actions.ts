"use server";
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---

export interface ChatChannel {
  id: string;
  name: string | null;
  type: "dm" | "group";
  farewell_id: string | null;
  created_at: string;
  // Joined fields
  is_pinned?: boolean;
  is_muted?: boolean;
  avatar_url?: string | null;
  is_dm?: boolean;
  members?: any[];
}

// --- CHANNELS ---

export async function getChannelsAction(
  farewellId: string,
  type: "primary" | "requests" = "primary"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 0. Ensure "General" channel exists for this farewell (Group Chat)
  // Only do this check for "primary" type to avoid double checking
  if (type === "primary") {
    const { data: generalChannel } = await supabase
      .from("chat_channels")
      .select("id")
      .eq("farewell_id", farewellId)
      .eq("name", "General")
      .single();

    let generalId = generalChannel?.id;

    if (!generalId) {
      // Create General Channel
      console.log("Creating General channel for farewell:", farewellId);
      const { data: newGeneral, error: genError } = await supabase
        .from("chat_channels")
        .insert({
          farewell_id: farewellId,
          name: "General",
          type: "group",
        })
        .select()
        .single();

      if (genError) {
        console.error("Error creating General channel:", genError);
      } else if (newGeneral) {
        generalId = newGeneral.id;
      }
    }

    // Ensure User is Member of General
    if (generalId) {
      const { data: isMember } = await supabase
        .from("chat_members")
        .select("id")
        .eq("channel_id", generalId)
        .eq("user_id", user.id)
        .single();

      if (!isMember) {
        console.log("Adding user to General channel...");
        const { error: joinError } = await supabase
          .from("chat_members")
          .insert({
            channel_id: generalId,
            user_id: user.id,
            status: "active",
          });
        if (joinError) {
          if (joinError.code === "23505") {
            console.log(
              "User already member of General (race condition handled)"
            );
          } else {
            console.error("Error joining General channel:", joinError);
          }
        }
      }
    }
  }
  // Filter by status based on 'type'
  // Primary: status = 'active'
  // Requests: status = 'pending'
  const statusFilter = type === "primary" ? "active" : "pending";

  const { data: memberships, error: memError } = await supabase
    .from("chat_members")
    .select("channel_id, is_pinned, is_muted")
    .eq("user_id", user.id)
    .eq("status", statusFilter);

  if (memError || !memberships || memberships.length === 0) return [];

  const channelIds = memberships.map((m) => m.channel_id);
  const membershipMap = new Map(memberships.map((m) => [m.channel_id, m]));

  // 2. Fetch Channel Details
  const { data: channels, error: chanError } = await supabase
    .from("chat_channels")
    .select(
      `
      *,
      members:chat_members(user_id, user:users(full_name, avatar_url))
    `
    )
    .in("id", channelIds)
    .order("created_at", { ascending: false });

  if (chanError) return [];

  // Filter: Keep DMs (global) AND Groups belonging to THIS farewell
  const relevantChannels = channels.filter(
    (c) => c.type === "dm" || c.farewell_id === farewellId
  );

  // 3. Format for UI
  const formattedChannels = relevantChannels.map((c) => {
    const myMemberData = membershipMap.get(c.id);

    if (c.type === "dm") {
      const otherMember = c.members.find((m: any) => m.user_id !== user.id);
      return {
        ...c,
        name: otherMember?.user?.full_name || "Unknown User",
        avatar_url: otherMember?.user?.avatar_url,
        is_dm: true,
        is_pinned: myMemberData?.is_pinned,
        is_muted: myMemberData?.is_muted,
      };
    }
    return {
      ...c,
      avatar_url: null,
      is_dm: false,
      is_pinned: myMemberData?.is_pinned,
      is_muted: myMemberData?.is_muted,
    };
  });

  // Sort: Pinned first, then General, then others
  return formattedChannels.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (a.name === "General") return -1;
    if (b.name === "General") return 1;
    return 0; // Keep date sort
  });
}

export async function getChannelDetailsAction(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get Membership
  const { data: membership } = await supabase
    .from("chat_members")
    .select("is_pinned, is_muted, status")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  // 2. Get Channel
  const { data: channel } = await supabase
    .from("chat_channels")
    .select(
      `
      *,
      members:chat_members(user_id, user:users(full_name, avatar_url))
    `
    )
    .eq("id", channelId)
    .single();

  if (!channel) return null;

  // 3. Format
  if (channel.type === "dm") {
    const otherMember = channel.members.find((m: any) => m.user_id !== user.id);
    return {
      ...channel,
      name: otherMember?.user?.full_name || "Unknown User",
      avatar_url: otherMember?.user?.avatar_url,
      is_dm: true,
      is_pinned: membership.is_pinned,
      is_muted: membership.is_muted,
      status: membership.status, // Important for filtering
    };
  }

  return {
    ...channel,
    avatar_url: null,
    is_dm: false,
    is_pinned: membership.is_pinned,
    is_muted: membership.is_muted,
    status: membership.status,
  };
}

export async function createDMAction(targetUserId: string, farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Check if DM already exists (Global check)
  const { data: myDMs } = await supabase
    .from("chat_members")
    .select("channel_id")
    .eq("user_id", user.id);

  if (myDMs && myDMs.length > 0) {
    const myChannelIds = myDMs.map((m) => m.channel_id);

    const { data: existing } = await supabase
      .from("chat_members")
      .select("channel_id")
      .eq("user_id", targetUserId)
      .in("channel_id", myChannelIds)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data: channel } = await supabase
        .from("chat_channels")
        .select("*")
        .eq("id", existing[0].channel_id)
        .eq("type", "dm")
        .single();

      if (channel) return { channelId: channel.id };
    }
  }

  // 2. Create New DM Channel (Global - No Farewell ID)
  console.log("Creating DM channel...");
  const { data: newChannel, error: createError } = await supabase
    .from("chat_channels")
    .insert({
      farewell_id: null, // Global DM
      type: "dm",
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating DM channel:", createError);
    return { error: `Failed to create chat: ${createError.message}` };
  }

  console.log("DM Channel created:", newChannel.id);

  // 3. Add Members
  const { error: memberError } = await supabase.from("chat_members").insert([
    { channel_id: newChannel.id, user_id: user.id, status: "active" },
    { channel_id: newChannel.id, user_id: targetUserId, status: "pending" },
  ]);

  if (memberError) {
    console.error("Error adding members:", memberError);
    return { error: `Failed to add members: ${memberError.message}` };
  }

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { channelId: newChannel.id };
}

export async function acceptRequestAction(
  channelId: string,
  farewellId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("chat_members")
    .update({ status: "active" })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to accept request" };

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function deleteRequestAction(
  channelId: string,
  farewellId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete request" };

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

// --- ADVANCED FEATURES (Pin, Restrict) ---

export async function togglePinAction(
  channelId: string,
  isPinned: boolean,
  farewellId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("chat_members")
    .update({ is_pinned: isPinned })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to update pin" };
  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function restrictUserAction(
  channelId: string,
  farewellId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Restrict = Mute + Move to Requests (or just hide?)
  // Let's just Mute for now as "Restrict" usually implies hidden.
  // To hide, we could set status back to 'pending' or 'ignored'.

  const { error } = await supabase
    .from("chat_members")
    .update({ is_muted: true, status: "ignored" })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to restrict user" };
  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

// --- MESSAGES (Edit/Delete) ---

export async function getMessagesAction(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(
      `
      *,
      user:users(id, full_name, avatar_url)
    `
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return messages;
}

export async function sendMessageAction(formData: FormData) {
  const supabase = await createClient();

  const content = formData.get("content") as string;
  const channelId = formData.get("channelId") as string;

  if (!content || !channelId) return { error: "Missing content or channel" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("chat_messages").insert({
    channel_id: channelId,
    user_id: user.id,
    content,
  });

  if (error) return { error: "Failed to send message" };

  return { success: true };
}

export async function editMessageAction(
  messageId: string,
  newContent: string,
  farewellId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("chat_messages")
    .update({
      content: newContent,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("user_id", user.id); // Security: Only own messages

  if (error) return { error: "Failed to edit message" };
  return { success: true };
}

export async function deleteMessageAction(
  messageId: string,
  farewellId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("chat_messages")
    .update({
      is_deleted: true,
      content: null, // Clear content for privacy
    })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete message" };
  return { success: true };
}

// --- BLOCKS ---

export async function blockUserAction(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: user.id,
    blocked_id: targetUserId,
  });

  if (error) return { error: "Failed to block user" };
  return { success: true };
}

export async function unblockUserAction(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId);

  if (error) return { error: "Failed to unblock user" };
  return { success: true };
}

// --- SEARCH ---

export async function searchUsersAction(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  console.log("Searching users with query:", query);
  console.log("Current user:", user.id);

  // Global Search: Search users table directly
  // Using OR logic for name and email
  const { data: usersFound, error: searchError } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, email")
    .neq("id", user.id) // Exclude current user from results
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (searchError) {
    console.error("Search error:", searchError);
    return [];
  }

  console.log("Found users:", usersFound?.length);
  return usersFound || [];
}
