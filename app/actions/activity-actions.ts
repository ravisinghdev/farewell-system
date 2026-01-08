"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { isFarewellAdmin } from "@/lib/auth/roles-server";

export interface AuditLogItem {
  id: string;
  action: string;
  user_id: string;
  target_id?: string;
  target_type?: string;
  metadata?: any;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

export async function getActivityLogsAction(
  farewellId: string
): Promise<AuditLogItem[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check Admin
  if (!(await isFarewellAdmin(farewellId, user.id))) {
    throw new Error("Unauthorized");
  }

  // 1. Fetch Logs (Raw) - Removed join, Use Admin for RLS bypass
  // 1. Fetch Logs (Raw) - Use standard client (relying on RLS policy)
  const { data: logsData, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }

  if (!logsData || logsData.length === 0) return [];

  // 2. Collect User IDs
  const userIds = Array.from(
    new Set((logsData as any[]).map((log: any) => log.user_id).filter(Boolean))
  );

  // 3. Fetch User Details
  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const userMap = new Map(usersData?.map((u) => [u.id, u]));

  // 4. Merge Data
  const enrichedLogs = (logsData as any[]).map((log: any) => ({
    ...log,
    user: userMap.get(log.user_id) || {
      full_name: "Unknown User",
      avatar_url: "",
      email: "",
    },
  }));

  return enrichedLogs as AuditLogItem[];
}
