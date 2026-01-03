"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath, unstable_cache } from "next/cache";
import { ActionState } from "@/types/custom";
import { supabaseAdmin } from "@/utils/supabase/admin";

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
  is_read?: boolean; // Virtual field
  call_to_action_label?: string | null;
  call_to_action_link?: string | null;
  call_to_action_type?: string | null;
}

// Cached version of farewell details
const getCachedFarewellDetails = unstable_cache(
  async (farewellId: string) => {
    const { data, error } = await supabaseAdmin
      .from("farewells")
      .select("*")
      .eq("id", farewellId)
      .single();

    if (error) return null;
    return data;
  },
  ["farewell-details"],
  {
    revalidate: 3600, // 1 hour
    tags: ["farewell-details"],
  }
);

export async function getFarewellDetailsAction(farewellId: string) {
  // Use cached version
  return getCachedFarewellDetails(farewellId);
}

export async function getAnnouncementsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Parallelize fetching:
  // 1. Check membership (vital for security)
  // 2. Fetch announcements (admin client, fast)
  const [memberResult, announcementsResult] = await Promise.all([
    supabaseAdmin
      .from("farewell_members")
      .select("role")
      .eq("farewell_id", farewellId)
      .eq("user_id", user.id)
      .single(),
    supabaseAdmin
      .from("announcements")
      .select(
        `
      *,
      creator:users(full_name, avatar_url)
    `
      )
      .eq("farewell_id", farewellId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const member = memberResult.data;
  // If not a member, strictly return empty (or could throw error if we want UI feedback)
  if (!member) return [];

  const announcements = announcementsResult.data || [];
  if (announcementsResult.error) {
    console.error("Error fetching announcements:", announcementsResult.error);
    return [];
  }

  // 3. Fetch read status for current user
  // This depends on having the announcements first to filter, BUT we can just query all reads for this user/farewell if the table format supports it,
  // or just IN query as before.
  // Optimization: If no announcements, skip.
  if (announcements.length === 0) return [];

  const { data: reads } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", user.id)
    .in(
      "announcement_id",
      announcements.map((a) => a.id)
    );

  const readIds = new Set(reads?.map((r) => r.announcement_id));

  return announcements.map((a) => ({
    ...a,
    is_read: readIds.has(a.id),
  })) as Announcement[];
}

export async function markAnnouncementAsReadAction(
  announcementId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("announcement_reads").upsert(
    {
      user_id: user.id,
      announcement_id: announcementId,
    },
    { onConflict: "user_id, announcement_id" }
  );

  if (error) return { error: error.message };
  return { success: true };
}

export async function createAnnouncementAction(
  farewellId: string,
  title: string,
  content: string,
  isPinned: boolean,
  ctaLabel?: string,
  ctaLink?: string,
  ctaType?: string
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
    call_to_action_label: ctaLabel,
    call_to_action_link: ctaLink,
    call_to_action_type: ctaType || "primary",
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
  isPinned: boolean,
  ctaLabel?: string,
  ctaLink?: string,
  ctaType?: string
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
      call_to_action_label: ctaLabel,
      call_to_action_link: ctaLink,
      call_to_action_type: ctaType || "primary",
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
  location: string | null;
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
  location: string,
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
    location,
    icon,
    created_by: userId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${farewellId}/timeline`);
  return { success: true };
}

export async function updateTimelineEventAction(
  id: string,
  farewellId: string,
  title: string,
  description: string,
  date: Date,
  location: string,
  icon: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data || !data.claims) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("timeline_events")
    .update({
      title,
      description,
      event_date: date.toISOString(),
      location,
      icon,
    })
    .eq("id", id);

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
  farewell_id: string; // Added field
  status: string; // Added field ('pending', 'approved', 'rejected')
}

export async function getHighlightsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check membership first for security since we'll use admin client
  const { data: member } = await supabaseAdmin
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .single();

  if (!member) return [];

  // Use admin client to bypass RLS on highlights table
  const { data, error } = await supabaseAdmin
    .from("highlights")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching highlights:", error);
    return [];
  }
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

const getCachedDashboardStats = unstable_cache(
  async (farewellId: string) => {
    // Use Admin Client to bypass RLS overhead for these heavy aggregates
    const [
      financialsResult,
      verifiedContributionsResult,
      memberCountResult,
      mediaCountResult,
      messageCountResult,
    ] = await Promise.all([
      // 1. Get approved financials
      supabaseAdmin
        .from("farewell_financials")
        .select("total_collected")
        .eq("farewell_id", farewellId)
        .single(),

      // 2. Get verified (but not approved) contributions sum
      supabaseAdmin
        .from("contributions")
        .select("amount")
        .eq("farewell_id", farewellId)
        .eq("status", "verified"),

      // 3. Direct Member Count
      supabaseAdmin
        .from("farewell_members")
        .select("*", { count: "exact", head: true })
        .eq("farewell_id", farewellId),

      // 4. Direct Media Count (via albums)
      supabaseAdmin
        .from("media")
        .select("id, albums!inner(farewell_id)", { count: "exact", head: true })
        .eq("albums.farewell_id", farewellId),

      // 5. Direct Message Count (via channels)
      supabaseAdmin
        .from("chat_messages")
        .select("id, chat_channels!inner(farewell_id)", {
          count: "exact",
          head: true,
        })
        .eq("chat_channels.farewell_id", farewellId),
    ]);

    // Calculate Total Collected
    const approvedTotal = Number(
      (financialsResult.data as any)?.total_collected || 0
    );
    const verifiedSum = (verifiedContributionsResult.data || []).reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    const totalCollected = approvedTotal + verifiedSum;

    return {
      contributions: totalCollected,
      messages: messageCountResult.count || 0,
      media: mediaCountResult.count || 0,
      members: memberCountResult.count || 0,
    };
  },
  ["dashboard-stats"],
  {
    revalidate: 30, // Cache for 30s to reduce DB load
    tags: ["dashboard-stats"],
  }
);

export async function getDashboardStatsAction(
  farewellId: string
): Promise<DashboardStats> {
  return getCachedDashboardStats(farewellId);
}

export async function getRecentTransactionsAction(farewellId: string) {
  // Use admin client for speed
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}

// NEW: Fetch assigned amount
export async function getFarewellAssignedAmountAction(farewellId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farewells")
    .select("target_amount, budget_goal")
    .eq("id", farewellId)
    .single();

  if (error) return { error: "Failed to fetch amount" };

  // Prefer target_amount (per person) over budget_goal (total)
  // If target_amount is null/0, maybe fallback to budget_goal or return 0
  return { amount: data.target_amount || 0 };
}

// STUBS for missing Highlight Comments actions
export async function getHighlightCommentsAction(highlightId: string) {
  return [];
}

export async function addHighlightCommentAction(
  highlightId: string,
  content: string,
  farewellId: string
) {
  return { error: "Comments feature currently disabled" };
}

export async function getPendingHighlightsAction(farewellId: string) {
  return [];
}

export async function approveHighlightAction(
  highlightId: string,
  farewellId: string
) {
  return { error: "Approval feature currently disabled" };
}

export async function rejectHighlightAction(
  highlightId: string,
  farewellId: string
) {
  return { error: "Rejection feature currently disabled" };
}

export async function toggleHighlightReactionAction(
  highlightId: string,
  type: string
) {
  return { error: "Reactions disabled" };
}
