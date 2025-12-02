import { createClient } from "@/utils/supabase/server";

export interface AuditLogEntry {
  farewellId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs an action to the audit_logs table.
 * This should be called from server actions.
 */
export async function logAudit(entry: AuditLogEntry) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Audit log attempted without authenticated user", entry);
      return;
    }

    const { error } = await supabase.from("audit_logs").insert({
      farewell_id: entry.farewellId,
      user_id: user.id,
      action: entry.action,
      target_id: entry.targetId,
      target_type: entry.targetType,
      metadata: entry.metadata || {},
    });

    if (error) {
      console.error("Failed to write audit log:", error);
    }
  } catch (err) {
    console.error("Error in logAudit:", err);
  }
}
