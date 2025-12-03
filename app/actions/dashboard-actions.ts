"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";

// --- Announcements ---
export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  created_by: string;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export async function getAnnouncementsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      creator:users(full_name, avatar_url)
    `
    )
    .eq("farewell_id", farewellId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Announcement[];
}

export async function createAnnouncementAction(
  farewellId: string,
  title: string,
  content: string,
  isPinned: boolean
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) return { error: "Not authenticated" };
  const userId = data.claims.sub;

  const { error } = await supabase.from("announcements").insert({
    farewell_id: farewellId,
    title,
    content,
    is_pinned: isPinned,
    created_by: userId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/announcements`);
  revalidatePath(`/dashboard/${farewellId}`); // Update home too
  return { success: true };
}

export async function deleteAnnouncementAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/announcements`);
  revalidatePath(`/dashboard/${farewellId}`);
  return { success: true };
}

export async function updateAnnouncementAction(
  id: string,
  farewellId: string,
  title: string,
  content: string,
  isPinned: boolean
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) return { error: "Not authenticated" };
  // No need for userId here unless checking permissions, but auth is required

  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      content,
      is_pinned: isPinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/announcements`);
  revalidatePath(`/dashboard/${farewellId}`);
  return { success: true };
}

export async function togglePinAnnouncementAction(
  id: string,
  farewellId: string,
  isPinned: boolean
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ is_pinned: isPinned })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/announcements`);
  return { success: true };
}

export async function toggleAnnouncementReactionAction(
  announcementId: string,
  reactionType: "like" | "bookmark"
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) return { error: "Not authenticated" };
  const userId = data.claims.sub;

  // Check if reaction exists
  const { data: existing } = await supabase
    .from("announcement_reactions")
    .select("id")
    .eq("announcement_id", announcementId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from("announcement_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    // Add reaction
    const { error } = await supabase.from("announcement_reactions").insert({
      announcement_id: announcementId,
      user_id: userId,
      reaction_type: reactionType,
    });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export interface AnnouncementReactionCounts {
  likes: number;
  bookmarks: number;
  userLiked: boolean;
  userBookmarked: boolean;
}

export async function getAnnouncementReactionsAction(
  announcementId: string
): Promise<AnnouncementReactionCounts> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const { data: reactions } = await supabase
    .from("announcement_reactions")
    .select("reaction_type, user_id")
    .eq("announcement_id", announcementId);

  const likes =
    reactions?.filter((r) => r.reaction_type === "like").length || 0;
  const bookmarks =
    reactions?.filter((r) => r.reaction_type === "bookmark").length || 0;
  const userLiked = userId
    ? reactions?.some((r) => r.user_id === userId && r.reaction_type === "like")
    : false;
  const userBookmarked = userId
    ? reactions?.some(
        (r) => r.user_id === userId && r.reaction_type === "bookmark"
      )
    : false;

  return {
    likes,
    bookmarks,
    userLiked: !!userLiked,
    userBookmarked: !!userBookmarked,
  };
}

// --- Timeline ---
export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  icon: string;
  created_at: string;
}

export async function getTimelineEventsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("event_date", { ascending: true });

  if (error) return [];
  return data as TimelineEvent[];
}

export async function createTimelineEventAction(
  farewellId: string,
  title: string,
  description: string,
  date: Date,
  icon: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) return { error: "Not authenticated" };
  const userId = data.claims.sub;

  const { error } = await supabase.from("timeline_events").insert({
    farewell_id: farewellId,
    title,
    description,
    event_date: date.toISOString(),
    icon,
    created_by: userId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/timeline`);
  return { success: true };
}

export async function deleteTimelineEventAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timeline_events")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/timeline`);
  return { success: true };
}

// --- Highlights ---
export interface Highlight {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  created_at: string;
}

export async function getHighlightsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Highlight[];
}

export async function createHighlightAction(
  farewellId: string,
  title: string,
  description: string,
  imageUrl: string,
  link: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) return { error: "Not authenticated" };
  const userId = data.claims.sub;

  const { error } = await supabase.from("highlights").insert({
    farewell_id: farewellId,
    title,
    description,
    image_url: imageUrl,
    link,
    created_by: userId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/highlights`);
  return { success: true };
}

export async function deleteHighlightAction(
  id: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/highlights`);
  return { success: true };
}

// --- Stats ---
export interface DashboardStats {
  contributions: number;
  messages: number;
  media: number;
  members: number;
}

export async function getDashboardStatsAction(
  farewellId: string
): Promise<DashboardStats> {
  const supabase = await createClient();

  const [contributions, messages, media, members] = await Promise.all([
    supabase
      .from("contributions")
      .select("amount", { count: "exact", head: true })
      .eq("farewell_id", farewellId),
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", farewellId), // Assuming farewell has a main channel or we need to query channels?
    // Wait, chat_messages are linked to channels, not farewells directly.
    // We need to find channels for this farewell.
    // Or maybe we just count messages in ALL channels for this farewell?
    // Let's assume for now we count messages in channels linked to this farewell.
    // But the schema says `chat_channels` has `scope_id`. Let's assume scope_id is farewell_id.
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("album_id", farewellId), // Wait, media is in albums. Albums are in farewells.
    supabase
      .from("farewell_members")
      .select("id", { count: "exact", head: true })
      .eq("farewell_id", farewellId),
  ]);

  // Fix queries for indirect relationships

  // 1. Contributions: direct link.
  // 2. Members: direct link.

  // 3. Messages: Need to find channels first.
  // const { data: channels } = await supabase.from("chat_channels").select("id").eq("scope_id", farewellId);
  // const channelIds = channels?.map(c => c.id) || [];
  // const { count: messageCount } = await supabase.from("chat_messages").select("id", { count: "exact", head: true }).in("channel_id", channelIds);

  // 4. Media: Need to find albums first.
  // const { data: albums } = await supabase.from("albums").select("id").eq("farewell_id", farewellId);
  // const albumIds = albums?.map(a => a.id) || [];
  // const { count: mediaCount } = await supabase.from("media").select("id", { count: "exact", head: true }).in("album_id", albumIds);

  // Let's implement this properly.

  // Actually, for speed, maybe we can just do simple queries if we can.
  // But let's do the proper relational queries.

  const { count: contributionsCount } = await supabase
    .from("contributions")
    .select("*", { count: "exact", head: true })
    .eq("farewell_id", farewellId);

  const { count: membersCount } = await supabase
    .from("farewell_members")
    .select("*", { count: "exact", head: true })
    .eq("farewell_id", farewellId);

  // For messages, we need to get channels first.
  const { data: channels } = await supabase
    .from("chat_channels")
    .select("id")
    .eq("scope_id", farewellId);

  let messagesCount = 0;
  if (channels && channels.length > 0) {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .in(
        "channel_id",
        channels.map((c) => c.id)
      );
    messagesCount = count || 0;
  }

  // For media, we need to get albums first.
  const { data: albums } = await supabase
    .from("albums")
    .select("id")
    .eq("farewell_id", farewellId);

  let mediaCount = 0;
  if (albums && albums.length > 0) {
    const { count } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .in(
        "album_id",
        albums.map((a) => a.id)
      );
    mediaCount = count || 0;
  }

  // Also get total contribution amount?
  const { data: contributionData } = await supabase
    .from("contributions")
    .select("amount")
    .eq("farewell_id", farewellId);

  const totalAmount =
    contributionData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  return {
    contributions: totalAmount, // Returning amount instead of count for "Contributions"
    messages: messagesCount,
    media: mediaCount,
    members: membersCount || 0,
  };
}

export async function getRecentTransactionsAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}
