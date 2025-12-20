import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple env loader
const envPath = path.resolve(process.cwd(), ".env");
console.log("Reading env from:", envPath);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    // Handle lines with comments or empty
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ""); // Remove quotes
      process.env[key] = value;
    }
  });
  console.log(
    "Loaded keys containing SUPABASE:",
    Object.keys(process.env).filter((k) => k.includes("SUPABASE"))
  );
} else {
  console.error("File does not exist at path:", envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars!");
  console.error("URL:", supabaseUrl ? "Found" : "Missing");
  console.error("Key:", supabaseKey ? "Found" : "Missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing query with Service Role Key...");

  const { data, error } = await supabase
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .limit(1);

  if (error) {
    console.error("Query Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Query Success. Data:", JSON.stringify(data, null, 2));
  }
}

test();
