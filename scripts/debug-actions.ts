import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const farewellId = "c18617f6-9221-40a7-b801-c2808a44c7cb";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function benchmark() {
  console.log("Starting Benchmark for:", farewellId);

  // 1. Financials
  console.time("Financials");
  const { data: fin } = await supabase
    .from("farewell_financials")
    .select("total_collected")
    .eq("farewell_id", farewellId)
    .single();
  console.timeEnd("Financials");

  // 2. Verified Contributions
  console.time("VerifiedContributions");
  const { data: verified } = await supabase
    .from("contributions")
    .select("amount")
    .eq("farewell_id", farewellId)
    .eq("status", "verified");
  console.timeEnd("VerifiedContributions");

  // 3. Members
  console.time("MemberCount");
  const { count: members } = await supabase
    .from("farewell_members")
    .select("*", { count: "exact", head: true })
    .eq("farewell_id", farewellId);
  console.timeEnd("MemberCount");

  // 4. Media
  console.time("MediaCount");
  const { count: media } = await supabase
    .from("media")
    .select("id, albums!inner(farewell_id)", { count: "exact", head: true })
    .eq("albums.farewell_id", farewellId);
  console.timeEnd("MediaCount");

  // 5. Messages
  console.time("MessageCount");
  const { count: messages } = await supabase
    .from("chat_messages")
    .select("id, chat_channels!inner(farewell_id)", {
      count: "exact",
      head: true,
    })
    .eq("chat_channels.farewell_id", farewellId);
  console.timeEnd("MessageCount");

  // 6. Recent Transactions
  console.time("RecentTx");
  const { data: tx } = await supabase
    .from("contributions")
    .select("id")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false })
    .limit(50);
  console.timeEnd("RecentTx");
}

benchmark();
