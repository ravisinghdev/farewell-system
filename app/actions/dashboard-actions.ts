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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("announcements").insert({
    farewell_id: farewellId,
    title,
    content,
    is_pinned: isPinned,
    created_by: user.id,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("timeline_events").insert({
    farewell_id: farewellId,
    title,
    description,
    event_date: date.toISOString(),
    icon,
    created_by: user.id,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("highlights").insert({
    farewell_id: farewellId,
    title,
    description,
    image_url: imageUrl,
    link,
    created_by: user.id,
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
