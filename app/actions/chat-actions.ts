"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { ActionState } from "@/types/custom";
import { createAdminClient } from "@/utils/supabase/admin";

// --- TYPES ---

export interface ChatMember {
  user_id: string;
  last_read_at?: string | null;
  role?: "member" | "admin" | "owner";
  status?: "active" | "pending" | "left";
  user: {
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  } | null;
}

export interface ChatChannel {
  id: string;
  name: string | null;
  type: "dm" | "group" | "farewell" | "class";
  scope_id: string | null;
  created_at: string;
  // Joined fields
  is_pinned?: boolean;
  is_muted?: boolean;
  status?: "active" | "muted" | "blocked" | "left" | "pending";
  avatar_url?: string | null;
  is_dm?: boolean;
  members?: ChatMember[];
  // Optional enhancements
  last_message?: {
    id: string;
    content: string | null;
    created_at: string;
    user_id: string;
  } | null;
}

// --- INTERNAL HELPERS ---

function standardError(message: string, error?: unknown): ActionState {
  if (error) {
    console.error(message, error);
  } else {
    console.error(message);
  }
  return { error: message };
}

async function getSupabaseContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching auth user:", error);
  }

  return { supabase, user: data?.user ?? null };
}

// --- CHANNELS / MEMBERSHIPS ---

// Getting Channels
export async function getChannelsAction(
  farewellId: string,
  type: "primary" | "requests" = "primary"
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return [];

  // 0. Ensure "General" channel exists for this farewell (Farewell Chat)
  if (type === "primary") {
    const { data: generalChannel, error: generalFetchError } = await supabase
      .from("chat_channels")
      .select("id")
      .eq("scope_id", farewellId)
      .eq("type", "farewell") // Use 'farewell' type for main channel
      .eq("is_deleted", false)
      .single();

    if (generalFetchError && generalFetchError.code !== "PGRST116") {
      console.error("Error fetching General channel:", generalFetchError);
    }

    let generalId = generalChannel?.id;

    if (!generalId && user.user_metadata?.role === "main_admin") {
      // Create General Channel
      console.log("Creating General channel for farewell:", farewellId);
      const supabaseAdmin = createAdminClient();
      const { data: newGeneral, error: genError } = await supabaseAdmin
        .from("chat_channels")
        .insert({
          scope_id: farewellId,
          name: "General",
          type: "farewell",
          is_deleted: false,
        })
        .select()
        .single();

      if (genError) {
        console.error("Error creating General channel:", genError);
      } else if (newGeneral) {
        generalId = newGeneral.id;
      }
    } else if (!generalId) {
      // Fallback: Try to find ANY channel for this farewell if General is missing
      const { data: anyChannel } = await supabase
        .from("chat_channels")
        .select("id")
        .eq("scope_id", farewellId)
        .eq("is_deleted", false)
        .limit(1)
        .single();

      if (anyChannel) generalId = anyChannel.id;
    }

    // Ensure User is Member of General
    if (generalId) {
      const { data: isMember, error: memberError } = await supabase
        .from("chat_members")
        .select("channel_id")
        .eq("channel_id", generalId)
        .eq("user_id", user.id)
        .single();

      if (memberError && memberError.code !== "PGRST116") {
        console.error("Error checking General membership:", memberError);
      }

      if (!isMember) {
        console.log("Adding user to General channel...");
        const supabaseAdmin = createAdminClient();
        const { error: joinError } = await supabaseAdmin
          .from("chat_members")
          .insert({
            channel_id: generalId,
            user_id: user.id,
            status: "active",
            is_pinned: false,
            is_muted: false,
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

  const statusFilter = type === "primary" ? "active" : "pending";

  const { data: memberships, error: memError } = await supabase
    .from("chat_members")
    .select("channel_id, is_pinned, status")
    .eq("user_id", user.id)
    .eq("status", statusFilter);

  if (memError) {
    console.error("Error fetching memberships:", memError);
    return [];
  }

  if (!memberships || memberships.length === 0) return [];

  const channelIds = memberships.map((m) => m.channel_id);
  const membershipMap = new Map(
    memberships.map((m) => [m.channel_id, m] as const)
  );

  // 2. Fetch Channel Details
  const { data: channels, error: chanError } = await supabase
    .from("chat_channels")
    .select(
      `
      *,
      members:chat_members(user_id, last_read_at, user:users(full_name, avatar_url))
    `
    )
    .in("id", channelIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (chanError) {
    console.error("Error fetching channels:", chanError);
    return [];
  }

  // 2b. Optional last message lookup
  const { data: lastMessages, error: lastMsgError } = await supabase
    .from("chat_messages")
    .select("id, channel_id, content, created_at, user_id, is_deleted")
    .in("channel_id", channelIds)
    .order("created_at", { ascending: false });

  if (lastMsgError) {
    console.error("Error fetching last messages:", lastMsgError);
  }

  const lastMessageMap = new Map<string, any>();
  if (lastMessages) {
    for (const m of lastMessages) {
      if (m.is_deleted) continue;
      if (!lastMessageMap.has(m.channel_id)) {
        lastMessageMap.set(m.channel_id, {
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          user_id: m.user_id,
        });
      }
    }
  }

  // Filter: Keep DMs (global) AND Groups belonging to THIS farewell
  const relevantChannels = (channels ?? []).filter(
    (c) => c.type === "dm" || c.scope_id === farewellId
  );

  // 3. Format for UI
  const formattedChannels: ChatChannel[] = relevantChannels.map((c: any) => {
    const myMemberData = membershipMap.get(c.id);
    const base: ChatChannel = {
      ...c,
      avatar_url: null,
      is_dm: false,
      is_pinned: myMemberData?.is_pinned ?? false,
      is_muted: myMemberData?.status === "muted",
      status: myMemberData?.status,
      last_message: lastMessageMap.get(c.id) ?? null,
    };

    if (c.type === "dm") {
      const otherMember = c.members?.find(
        (m: ChatMember) => m.user_id !== user.id
      );
      return {
        ...base,
        name: otherMember?.user?.full_name || "Unknown User",
        avatar_url: otherMember?.user?.avatar_url,
        is_dm: true,
      };
    }

    return {
      ...base,
      avatar_url: null,
      is_dm: false,
    };
  });

  // Sort: Pinned first, then General, then others (then recent)
  return formattedChannels.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (a.name === "General") return -1;
    if (b.name === "General") return 1;
    return 0;
  });
}

export async function getChannelDetailsAction(channelId: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return null;

  // 1. Get Membership
  const { data: membership, error: memError } = await supabase
    .from("chat_members")
    .select("is_pinned, is_muted, status")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (memError) {
    console.error("Error fetching membership:", memError);
    return null;
  }

  if (!membership) return null;

  // 2. Get Channel
  const { data: channel, error: chanError } = await supabase
    .from("chat_channels")
    .select(
      `
      *,
      members:chat_members(user_id, last_read_at, user:users(full_name, avatar_url))
    `
    )
    .eq("id", channelId)
    .eq("is_deleted", false)
    .single();

  if (chanError) {
    console.error("Error fetching channel:", chanError);
    return null;
  }

  if (!channel) return null;

  // 3. Format
  if (channel.type === "dm") {
    const otherMember = channel.members.find(
      (m: ChatMember) => m.user_id !== user.id
    );
    return {
      ...channel,
      name: otherMember?.user?.full_name || "Unknown User",
      avatar_url: otherMember?.user?.avatar_url,
      is_dm: true,
      is_pinned: membership.is_pinned,
      is_muted: membership.status === "muted",
      status: membership.status,
    };
  }

  return {
    ...channel,
    avatar_url: null,
    is_dm: false,
    is_pinned: membership.is_pinned,
    is_muted: membership.status === "muted",
    status: membership.status,
  };
}

export async function createDMAction(
  targetUserId: string,
  farewellId: string,
  initialMessage?: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  // 1. Check if DM already exists
  // Logic: Find a 'dm' channel where both users are members
  // This is complex in pure Supabase query, often easier with RPC or two steps
  // For now, we'll try a simplified approach:
  // Find all DM channels I am in, then check if target is in them.

  const { data: myDMs } = await supabase
    .from("chat_members")
    .select("channel_id")
    .eq("user_id", user.id);

  if (myDMs && myDMs.length > 0) {
    const myDMIds = myDMs.map((m) => m.channel_id);
    const { data: existingDM } = await supabase
      .from("chat_members")
      .select("channel_id")
      .eq("user_id", targetUserId)
      .in("channel_id", myDMIds)
      .limit(1)
      .single();

    if (existingDM) {
      // Check if it's actually a DM type
      const { data: channelType } = await supabase
        .from("chat_channels")
        .select("type")
        .eq("id", existingDM.channel_id)
        .single();

      if (channelType?.type === "dm") {
        return { channelId: existingDM.channel_id };
      }
    }
  }

  // 2. Create new DM Channel
  const supabaseAdmin = createAdminClient();
  const { data: newChannel, error: createError } = await supabaseAdmin
    .from("chat_channels")
    .insert({
      type: "dm",
      scope_id: null, // DMs are global or null scope
      is_deleted: false,
    })
    .select()
    .single();

  if (createError) {
    return standardError("Failed to create chat", createError);
  }

  // 3. Add Members (Sender & Target)
  const { error: memberError } = await supabaseAdmin
    .from("chat_members")
    .insert([
      {
        channel_id: newChannel.id,
        user_id: user.id,
        status: "active",
      },
      {
        channel_id: newChannel.id,
        user_id: targetUserId,
        status: "pending", // DM request
      },
    ]);

  if (memberError) {
    console.error("Failed to add members to DM:", memberError);
  }

  // 4. Send Initial Message if provided
  if (initialMessage) {
    const { error: msgError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        channel_id: newChannel.id,
        user_id: user?.id,
        content: initialMessage,
      });

    if (msgError) {
      console.error("Failed to send initial message:", msgError);
      // Don't fail the whole action, just log it
    }
  }

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { channelId: newChannel.id };
}

export async function acceptRequestAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ status: "active" })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to accept request", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function deleteRequestAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to delete request", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

// --- ADVANCED FEATURES (Pin, Restrict, Delete Channel) ---

export async function togglePinAction(
  channelId: string,
  isPinned: boolean,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ is_pinned: isPinned })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to update pin", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function restrictUserAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ status: "muted" }) // Changed from is_muted: true to status: 'muted'
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to restrict user", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

// Soft delete a channel (non-breaking: just hide everywhere using is_deleted)
export async function deleteChannelAction(
  channelId: string,
  farewellId: string
): Promise<ActionState> {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_channels")
    .update({ is_deleted: true })
    .eq("id", channelId);

  if (error) return standardError("Failed to delete channel", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function createChannelAction(
  name: string,
  farewellId: string,
  type: "group" | "farewell" = "group"
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const supabaseAdmin = createAdminClient();

  const { data: newChannel, error } = await supabaseAdmin
    .from("chat_channels")
    .insert({
      scope_id: farewellId,
      name: name,
      type: type,
      is_deleted: false,
      status: "pending", // New groups require approval
    })
    .select()
    .single();

  if (error) return standardError("Failed to create channel", error);

  // Add creator as admin member (using admin client to ensure it works)
  const { error: memberError } = await supabaseAdmin
    .from("chat_members")
    .insert({
      channel_id: newChannel.id,
      user_id: user.id,
      status: "active",
      is_pinned: false,
      is_muted: false,
      role: "owner",
    });

  if (memberError) {
    console.error("Failed to add creator to channel:", memberError);
  }

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true, channelId: newChannel.id };
}

// --- MESSAGES (Edit/Delete/Fetch) ---

export async function getMessagesAction(channelId: string) {
  const { supabase, user } = await getSupabaseContext();
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

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return messages ?? [];
}

export async function sendMessageAction(formData: FormData) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const content = formData.get("content") as string;
  const channelId = formData.get("channelId") as string;
  const file = formData.get("file") as File | null;
  const replyToId = formData.get("replyToId") as string | null;

  if ((!content && !file) || !channelId) {
    return standardError("Missing content or channel");
  }

  let fileUrl = null;
  let messageType = "text";

  if (file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `${channelId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return standardError("Failed to upload file");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);

    fileUrl = publicUrl;
    messageType = file.type.startsWith("image/") ? "image" : "file";
  }

  // Optional: rate limiting via RPC (see SQL section)
  try {
    const { data: canSend, error: rateError } = await supabase.rpc(
      "can_send_message",
      { p_user_id: user.id }
    );

    if (rateError) {
      // console.error("Rate limit check error:", rateError);
      // Fail open (do not block message) if rate check fails or RPC missing
    } else if (canSend === false) {
      return standardError(
        "You are sending messages too quickly. Please wait a moment."
      );
    }
  } catch (e) {
    // console.error("Rate limit RPC threw:", e);
  }

  const { error } = await supabase.from("chat_messages").insert({
    channel_id: channelId,
    user_id: user.id,
    content: content || null,
    type: messageType,
    file_url: fileUrl,
    reply_to_id: replyToId || null,
  });

  if (error) return standardError("Failed to send message", error);

  return { success: true };
}

export async function editMessageAction(
  messageId: string,
  newContent: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_messages")
    .update({
      content: newContent,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("user_id", user.id); // Only own messages

  if (error) return standardError("Failed to edit message", error);
  return { success: true };
}

export async function deleteMessageAction(
  messageId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_messages")
    .update({
      is_deleted: true,
      content: null, // Clear content for privacy
    })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to delete message", error);
  return { success: true };
}

// --- READ RECEIPTS / TYPING ---

export async function markMessageSeenAction(
  channelId: string,
  messageId: string // kept for compatibility, but we update channel-level read status
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to mark message as seen", error);
  return { success: true };
}

export async function sendTypingAction(channelId: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return;

  const { error } = await supabase.from("typing_state").upsert({
    user_id: user.id,
    channel_id: channelId,
    last_typed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to update typing state:", error);
  }
}

// --- REACTIONS (Optional, Non-breaking) ---

export async function addReactionAction(messageId: string, reaction: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const trimmed = reaction.trim();
  if (!trimmed) return standardError("Reaction cannot be empty");

  // 1. Delete ANY existing reaction by this user on this message
  // This enforces "one user can only give only one reaction"
  await supabase
    .from("chat_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id);

  // 2. Insert the new reaction
  const { error } = await supabase.from("chat_reactions").insert({
    message_id: messageId,
    user_id: user.id,
    reaction: trimmed, // Ensure column is 'reaction' (after SQL fix)
  });

  if (error) return standardError("Failed to add reaction", error);
  return { success: true };
}

export async function removeReactionAction(messageId: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to remove reaction", error);
  return { success: true };
}

// --- BLOCKS ---

export async function blockUserAction(targetUserId: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: user.id,
    blocked_id: targetUserId,
  });

  if (error) return standardError("Failed to block user", error);
  return { success: true };
}

export async function unblockUserAction(targetUserId: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUserId);

  if (error) return standardError("Failed to unblock user", error);
  return { success: true };
}

export async function searchUsersAction(query: string, farewellId: string) {
  const { supabase } = await getSupabaseContext();
  // Simple search by name in farewell_members -> users
  // This requires a join or a view.
  // For simplicity, let's assume we can search users directly if they are in the farewell
  // Or better, search farewell_members and join users.

  const { data, error } = await supabase
    .from("farewell_members")
    .select("user:users(id, full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .ilike("user.full_name", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  // Flatten structure
  return data.map((d: any) => d.user).filter(Boolean);
}

export async function updatePublicKeyAction(publicKey: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({ public_key: publicKey })
    .eq("id", user.id);

  if (error) return standardError("Failed to update public key", error);
  return { success: true };
}

export async function getPublicKeyAction(userId: string) {
  const { supabase } = await getSupabaseContext();
  const { data, error } = await supabase
    .from("users")
    .select("public_key")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.public_key;
}

export async function addMemberToChannelAction(
  channelId: string,
  targetUserId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  // Check if user is admin of the farewell or creator of the channel (if we track that)
  // For now, we'll allow any member to add others for simplicity, or restrict to main_admin/admin
  // Ideally, check if current user is admin of the farewell context
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  let isAdmin = member?.role === "admin" || member?.role === "main_admin";

  if (!isAdmin) {
    // Check if it's a custom group and user is a member
    const { data: channel } = await supabase
      .from("chat_channels")
      .select("type")
      .eq("id", channelId)
      .single();

    if (channel?.type === "group") {
      const { data: isMember } = await supabase
        .from("chat_members")
        .select("status")
        .eq("channel_id", channelId)
        .eq("user_id", user.id)
        .single();

      if (isMember?.status === "active") {
        isAdmin = true;
      }
    }
  }

  if (!isAdmin) {
    return standardError("Only admins can add members to groups");
  }

  const { error } = await supabase.from("chat_members").insert({
    channel_id: channelId,
    user_id: targetUserId,
    status: "pending", // Invite system: user must accept
    role: "member",
  });

  if (error) {
    if (error.code === "23505")
      return standardError("User is already a member");
    return standardError("Failed to add member", error);
  }

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function removeMemberFromChannelAction(
  channelId: string,
  targetUserId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  // Check if user is Farewell Admin OR Group Admin
  const { data: farewellMember } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  let isAdmin =
    farewellMember?.role === "admin" || farewellMember?.role === "main_admin";

  if (!isAdmin) {
    const { data: chatMember } = await supabase
      .from("chat_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();
    if (chatMember?.role === "admin" || chatMember?.role === "owner") {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return standardError("Only admins can remove members");
  }

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", targetUserId);

  if (error) return standardError("Failed to remove member", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function leaveChannelAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) return standardError("Failed to leave group", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function promoteMemberAction(
  channelId: string,
  targetUserId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  // Verify requester is admin
  const { data: requester } = await supabase
    .from("chat_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (requester?.role !== "admin" && requester?.role !== "owner") {
    return standardError("Only admins can promote members");
  }

  const { error } = await supabase
    .from("chat_members")
    .update({ role: "admin" })
    .eq("channel_id", channelId)
    .eq("user_id", targetUserId);

  if (error) return standardError("Failed to promote member", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function demoteMemberAction(
  channelId: string,
  targetUserId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  // Verify requester is admin
  const { data: requester } = await supabase
    .from("chat_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (requester?.role !== "admin" && requester?.role !== "owner") {
    return standardError("Only admins can demote members");
  }

  const { error } = await supabase
    .from("chat_members")
    .update({ role: "member" })
    .eq("channel_id", channelId)
    .eq("user_id", targetUserId);

  if (error) return standardError("Failed to demote member", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function getPendingChannelsAction(farewellId: string) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return [];

  // Check if user is Farewell Admin
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  const isFarewellAdmin =
    member?.role === "admin" || member?.role === "main_admin";

  if (!isFarewellAdmin) return [];

  const { data: channels, error } = await supabase
    .from("chat_channels")
    .select("*")
    .eq("scope_id", farewellId)
    .eq("status", "pending")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending channels:", error);
    return [];
  }

  return channels || [];
}

export async function approveChannelAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, user } = await getSupabaseContext();
  if (!user) return standardError("Not authenticated");

  // Check if user is Farewell Admin
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  const isFarewellAdmin =
    member?.role === "admin" || member?.role === "main_admin";

  if (!isFarewellAdmin) {
    return standardError("Only admins can approve groups");
  }

  const { error } = await supabase
    .from("chat_channels")
    .update({ status: "active" })
    .eq("id", channelId);

  if (error) return standardError("Failed to approve channel", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}
