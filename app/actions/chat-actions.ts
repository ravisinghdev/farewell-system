"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { ActionState } from "@/types/custom";
import { createAdminClient } from "@/utils/supabase/admin";
import { z } from "zod";
import { checkIsAdmin } from "@/lib/auth/roles";

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

// --- SCHEMAS ---

const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  farewellId: z.string().uuid(),
  type: z.enum(["group", "farewell"]),
});

const createDMSchema = z.object({
  targetUserId: z.string().uuid(),
  farewellId: z.string().uuid(),
  initialMessage: z.string().max(5000).optional(),
});

const editMessageSchema = z.object({
  messageId: z.string().uuid(),
  newContent: z.string().min(1).max(5000),
  farewellId: z.string().uuid(),
});

const addReactionSchema = z.object({
  messageId: z.string().uuid(),
  reaction: z.string().min(1).max(10),
});

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
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub || null;

  return { supabase, userId };
}

// --- CHANNELS / MEMBERSHIPS ---

// Getting Channels
export async function getChannelsAction(
  farewellId: string,
  type: "primary" | "requests" = "primary"
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return [];

  const statusFilter = type === "primary" ? "active" : "pending";

  const { data: memberships, error: memError } = await supabase
    .from("chat_members")
    .select("channel_id, is_pinned, status")
    .eq("user_id", userId)
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

  // 2. Fetch Channel Details with Preview Text
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
    .order("last_message_at", { ascending: false }); // Sort by last activity directly

  if (chanError) {
    console.error("Error fetching channels:", chanError);
    return [];
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
      // Use the preview_text field which is maintained by triggers
      last_message: c.last_message_at
        ? {
            id: "latest", // We don't have ID, but we don't need it for list view usually
            content: c.preview_text || "No messages yet",
            created_at: c.last_message_at,
            user_id: "", // Not available in preview, but acceptable for scalable list
          }
        : null,
    };

    if (c.type === "dm") {
      const otherMember = c.members?.find(
        (m: ChatMember) => m.user_id !== userId
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

  // Sort: Pinned first, then by last_message_at (which is natural now)
  return formattedChannels.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (a.name === "General") return -1;
    if (b.name === "General") return 1;

    // Fallback to sort by date if not pinned (though DB sort handled most)
    const dateA = new Date(a.created_at).getTime(); // or last_message_at if available
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
}

export async function getChannelDetailsAction(channelId: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return null;

  const [membershipResult, channelResult] = await Promise.all([
    supabase
      .from("chat_members")
      .select("is_pinned, is_muted, status")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("chat_channels")
      .select(
        `
      *,
      members:chat_members(user_id, last_read_at, user:users(full_name, avatar_url))
    `
      )
      .eq("id", channelId)
      .eq("is_deleted", false)
      .single(),
  ]);

  const { data: membership, error: memError } = membershipResult;
  const { data: channel, error: chanError } = channelResult;

  if (memError) {
    console.error("Error fetching membership:", memError);
    return null;
  }

  if (!membership) return null;

  if (chanError) {
    console.error("Error fetching channel:", chanError);
    return null;
  }

  if (!channel) return null;

  // 3. Format
  if (channel.type === "dm") {
    const otherMember = channel.members.find(
      (m: ChatMember) => m.user_id !== userId
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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const parseResult = createDMSchema.safeParse({
    targetUserId,
    farewellId,
    initialMessage,
  });
  if (!parseResult.success) {
    return standardError(
      "Invalid input: " + parseResult.error.issues[0].message
    );
  }

  const { data: myDMs } = await supabase
    .from("chat_members")
    .select("channel_id")
    .eq("user_id", userId);

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

  const supabaseAdmin = createAdminClient();
  const { data: newChannel, error: createError } = await supabaseAdmin
    .from("chat_channels")
    .insert({
      type: "dm",
      scope_id: null,
      is_deleted: false,
    })
    .select()
    .single();

  if (createError) {
    return standardError("Failed to create chat", createError);
  }

  const { error: memberError } = await supabaseAdmin
    .from("chat_members")
    .insert([
      {
        channel_id: newChannel.id,
        user_id: userId,
        status: "active",
      },
      {
        channel_id: newChannel.id,
        user_id: targetUserId,
        status: "pending",
      },
    ]);

  if (memberError) {
    console.error("Failed to add members to DM:", memberError);
  }

  if (initialMessage) {
    const { error: msgError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        channel_id: newChannel.id,
        user_id: userId,
        content: initialMessage,
      });

    if (msgError) {
      console.error("Failed to send initial message:", msgError);
    }
  }

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { channelId: newChannel.id };
}

export async function acceptRequestAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ status: "active" })
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to accept request", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function deleteRequestAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", userId);

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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ is_pinned: isPinned })
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to update pin", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function restrictUserAction(
  channelId: string,
  farewellId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ status: "muted" })
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to restrict user", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function deleteChannelAction(
  channelId: string,
  farewellId: string
): Promise<ActionState> {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const parseResult = createChannelSchema.safeParse({ name, farewellId, type });
  if (!parseResult.success) {
    return standardError(
      "Invalid input: " + parseResult.error.issues[0].message
    );
  }

  const supabaseAdmin = createAdminClient();

  const { data: newChannel, error } = await supabaseAdmin
    .from("chat_channels")
    .insert({
      scope_id: farewellId,
      name: name,
      type: type,
      is_deleted: false,
      status: "pending",
    })
    .select()
    .single();

  if (error) return standardError("Failed to create channel", error);

  const { error: memberError } = await supabaseAdmin
    .from("chat_members")
    .insert({
      channel_id: newChannel.id,
      user_id: userId,
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

export async function getMessagesAction(
  channelId: string,
  limit: number = 50,
  before?: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return [];

  let query = supabase
    .from("chat_messages")
    .select(
      `
      *,
      user:users(id, full_name, avatar_url)
    `
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return messages ? messages.reverse() : [];
}

const sendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  channelId: z.string().uuid(),
  replyToId: z.string().uuid().optional().nullable(),
});

export async function sendMessageAction(formData: FormData) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const content = formData.get("content") as string;
  const channelId = formData.get("channelId") as string;
  const file = formData.get("file") as File | null;
  const replyToId = formData.get("replyToId") as string | null;

  const parseResult = sendMessageSchema.safeParse({
    content,
    channelId,
    replyToId: replyToId || undefined,
  });

  if (!parseResult.success) {
    return standardError(
      "Invalid input: " + parseResult.error.issues[0].message
    );
  }

  if ((!content && !file) || !channelId) {
    return standardError("Missing content or channel");
  }

  let fileUrl = null;
  let messageType = "text";

  if (file) {
    if (file.size > 50 * 1024 * 1024) {
      return standardError("File too large (max 50MB)");
    }

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

  try {
    const { data: canSend, error: rateError } = await supabase.rpc(
      "can_send_message",
      { p_user_id: userId }
    );

    if (rateError) {
      // console.error("Rate limit check error:", rateError);
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
    user_id: userId,
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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const parseResult = editMessageSchema.safeParse({
    messageId,
    newContent,
    farewellId,
  });
  if (!parseResult.success) {
    return standardError(
      "Invalid input: " + parseResult.error.issues[0].message
    );
  }

  const { error } = await supabase
    .from("chat_messages")
    .update({
      content: newContent,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to edit message", error);
  return { success: true };
}

export async function deleteMessageAction(
  messageId: string,
  farewellId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_messages")
    .update({
      is_deleted: true,
      content: null,
    })
    .eq("id", messageId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to delete message", error);
  return { success: true };
}

// --- READ RECEIPTS / TYPING ---

export async function markMessageSeenAction(
  channelId: string,
  messageId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to mark message as seen", error);
  return { success: true };
}

// --- REACTIONS (Optional, Non-breaking) ---

export async function addReactionAction(messageId: string, reaction: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const parseResult = addReactionSchema.safeParse({ messageId, reaction });
  if (!parseResult.success) {
    return standardError(
      "Invalid input: " + parseResult.error.issues[0].message
    );
  }

  await supabase
    .from("chat_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId);

  const { error } = await supabase.from("chat_reactions").insert({
    message_id: messageId,
    user_id: userId,
    reaction: reaction.trim(),
  });

  if (error) return standardError("Failed to add reaction", error);
  return { success: true };
}

export async function removeReactionAction(messageId: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to remove reaction", error);
  return { success: true };
}

// --- BLOCKS ---

export async function blockUserAction(targetUserId: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: userId,
    blocked_id: targetUserId,
  });

  if (error) return standardError("Failed to block user", error);
  return { success: true };
}

export async function unblockUserAction(targetUserId: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", targetUserId);

  if (error) return standardError("Failed to unblock user", error);
  return { success: true };
}

export async function searchUsersAction(query: string, farewellId: string) {
  const { supabase } = await getSupabaseContext();

  const { data, error } = await supabase
    .from("farewell_members")
    .select("user:users(id, full_name, avatar_url, email, username)")
    .eq("farewell_id", farewellId)
    .ilike("user.full_name", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data.map((d: any) => d.user).filter(Boolean);
}

export async function updatePublicKeyAction(publicKey: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({ public_key: publicKey })
    .eq("id", userId);

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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  let isAdmin = checkIsAdmin(member?.role);

  if (!isAdmin) {
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
        .eq("user_id", userId)
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
    status: "pending",
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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: farewellMember } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  let isAdmin =
    farewellMember?.role === "admin" || farewellMember?.role === "main_admin";

  if (!isAdmin) {
    const { data: chatMember } = await supabase
      .from("chat_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) return standardError("Failed to leave group", error);

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function promoteMemberAction(
  channelId: string,
  targetUserId: string,
  farewellId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: requester } = await supabase
    .from("chat_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: requester } = await supabase
    .from("chat_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return [];

  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  const isFarewellAdmin =
    member?.role === "admin" ||
    member?.role === "main_admin" ||
    member?.role === "parallel_admin";

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
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  const isFarewellAdmin =
    member?.role === "admin" ||
    member?.role === "main_admin" ||
    member?.role === "parallel_admin";

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

// --- COMPLAINTS & ADMIN REQUESTS ---

export async function raiseComplaintAction(
  farewellId: string,
  reason: string = "Not added to default group",
  type: "default_group" | "custom" = "default_group"
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: existing } = await supabase
    .from("chat_complaints")
    .select("id")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .single();

  if (existing) {
    return standardError("You already have a pending complaint.");
  }

  const { error } = await supabase.from("chat_complaints").insert({
    farewell_id: farewellId,
    user_id: userId,
    status: "pending",
    type: type,
    reason: reason,
  });

  if (error) return standardError("Failed to raise complaint", error);
  return { success: true };
}

export async function resolveComplaintAction(
  complaintId: string,
  action: "resolve" | "reject",
  farewellId: string
) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return standardError("Not authenticated");

  const { data: adminMember } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  if (
    !adminMember ||
    (adminMember.role !== "admin" &&
      adminMember.role !== "main_admin" &&
      adminMember.role !== "parallel_admin")
  ) {
    return standardError("Unauthorized");
  }

  const supabaseAdmin = createAdminClient();

  if (action === "resolve") {
    const { data: complaint } = await supabaseAdmin
      .from("chat_complaints")
      .select("user_id")
      .eq("id", complaintId)
      .single();

    if (!complaint) return standardError("Complaint not found");

    const { data: generalChannel } = await supabaseAdmin
      .from("chat_channels")
      .select("id")
      .eq("scope_id", farewellId)
      .eq("type", "farewell")
      .single();

    if (generalChannel) {
      await supabaseAdmin.from("chat_members").upsert({
        channel_id: generalChannel.id,
        user_id: complaint.user_id,
        status: "active",
      });
    }

    await supabaseAdmin
      .from("chat_complaints")
      .update({ status: "resolved" })
      .eq("id", complaintId);
  } else {
    await supabaseAdmin
      .from("chat_complaints")
      .update({ status: "rejected" })
      .eq("id", complaintId);
  }

  revalidatePath(`/dashboard/${farewellId}/messages`);
  return { success: true };
}

export async function getAdminChatRequestsAction(farewellId: string) {
  const { supabase, userId } = await getSupabaseContext();
  if (!userId) return { complaints: [], groupRequests: [] };

  const { data: adminMember } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  if (
    !adminMember ||
    (adminMember.role !== "admin" &&
      adminMember.role !== "main_admin" &&
      adminMember.role !== "parallel_admin")
  ) {
    return { complaints: [], groupRequests: [] };
  }

  const supabaseAdmin = createAdminClient();

  const { data: complaints } = await supabaseAdmin
    .from("chat_complaints")
    .select("*, user:users(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: groupRequests } = await supabaseAdmin
    .from("chat_channels")
    .select("*, members:chat_members(user:users(full_name))")
    .eq("scope_id", farewellId)
    .eq("status", "pending")
    .eq("is_deleted", false);

  const enrichedGroupRequests = await Promise.all(
    (groupRequests || []).map(async (g) => {
      const { data: ownerMember } = await supabaseAdmin
        .from("chat_members")
        .select("user:users(full_name, avatar_url)")
        .eq("channel_id", g.id)
        .eq("role", "owner")
        .single();
      return { ...g, creator: ownerMember?.user };
    })
  );

  return {
    complaints: complaints || [],
    groupRequests: enrichedGroupRequests || [],
  };
}
