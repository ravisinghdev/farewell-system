"use client";

import { supabaseClient } from "@/utils/supabase/client";
import { useEffect, useState, use } from "react";
import { useFarewell } from "@/components/providers/farewell-provider";

export default function DebugPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useFarewell();
  const [logs, setLogs] = useState<string[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    const runChecks = async () => {
      const supabase = supabaseClient;

      log(`User: ${user?.id || "Not logged in"}`);

      // 1. Check Chat Channels Policies (via RPC if possible, or just inference)
      // We can't query pg_policies from client directly usually.
      // But we can try to perform actions and see what happens.

      // Test 1: Create a dummy DM channel
      log("Attempting to create dummy DM channel...");
      const { data: dm, error: dmError } = await supabase
        .from("chat_channels")
        .insert({ type: "dm", farewell_id: null })
        .select()
        .single();

      if (dmError) {
        log(`❌ DM Creation Failed: ${dmError.message} (${dmError.code})`);
      } else {
        log(`✅ DM Created: ${dm.id}`);
        // Cleanup
        await supabase.from("chat_channels").delete().eq("id", dm.id);
      }

      // Test 2: Create a dummy Group channel
      log("Attempting to create dummy Group channel...");
      const { data: group, error: groupError } = await supabase
        .from("chat_channels")
        .insert({ type: "group", farewell_id: id, name: "Debug Group" })
        .select()
        .single();

      if (groupError) {
        log(
          `❌ Group Creation Failed: ${groupError.message} (${groupError.code})`
        );
      } else {
        log(`✅ Group Created: ${group.id}`);
        // Cleanup
        await supabase.from("chat_channels").delete().eq("id", group.id);
      }

      // Test 3: Check Farewell Membership
      log("Checking Farewell Membership...");
      const { data: member, error: memError } = await supabase
        .from("farewell_members")
        .select("*")
        .eq("farewell_id", id)
        .eq("user_id", user?.id)
        .single();

      if (memError) {
        log(`❌ Membership Check Failed: ${memError.message}`);
      } else {
        log(`✅ Membership Found: ${member ? "Yes" : "No"}`);
      }
    };

    runChecks();
  }, [id]);

  return (
    <div className="p-8 space-y-4 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-bold">RLS Debugger</h1>
      <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
        {logs.map((l, i) => (
          <div key={i} className="mb-1 border-b border-border/10 pb-1">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
