import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("Service Key:", serviceKey ? "Found" : "Missing");

if (!supabaseUrl || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  console.log("Testing Admin Connection...");

  // 1. List Farewells
  // Fixed: Use 'name' instead of 'title'
  const { data: farewells, error: fError } = await admin
    .from("farewells")
    .select("id, name")
    .limit(5);
  if (fError) {
    console.error("Error fetching farewells:", fError);
    return;
  }
  console.log(`Found ${farewells.length} farewells:`);
  farewells.forEach((f) => console.log(` - ${f.id}: ${f.name}`));

  if (farewells.length === 0) return;

  const testId = farewells[0].id;

  // 2. Contributions
  console.log(`\nChecking contributions for farewell ${testId}...`);
  const { data: contributions, error: cError } = await admin
    .from("contributions")
    .select("*")
    .eq("farewell_id", testId)
    .limit(5);

  if (cError) {
    console.error("Error fetching contributions:", cError);
  } else {
    console.log(`Found ${contributions.length} contributions.`);
    contributions.forEach((c) =>
      console.log(` - ${c.id}: ${c.amount} (${c.status}) user=${c.user_id}`)
    );
  }
}

run();
