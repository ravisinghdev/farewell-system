import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Found" : "Missing");
console.log(
  "Key:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Found" : "Missing"
);

import { createAdminClient } from "../utils/supabase/admin";

async function createBucket() {
  const supabase = createAdminClient();

  console.log("Creating 'memories' bucket...");
  const { data, error } = await supabase.storage.createBucket("memories", {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ["image/*", "video/*"],
  });

  if (error) {
    if (error.message.includes("already exists")) {
      console.log("Bucket 'memories' already exists.");
    } else {
      console.error("Error creating bucket:", error);
    }
  } else {
    console.log("Bucket 'memories' created successfully:", data);
  }
}

createBucket();
