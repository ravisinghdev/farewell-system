import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDuties() {
  console.log("Debugging Duties...");

  // 1. Check if we can fetch duties
  console.log("1. Fetching duties...");
  const { data: duties, error: dutiesError } = await supabase
    .from("duties")
    .select("id")
    .limit(1);

  if (dutiesError) {
    console.error(
      "Error fetching duties:",
      JSON.stringify(dutiesError, null, 2)
    );
    return;
  }
  console.log("Duties fetched:", duties?.length);

  if (duties && duties.length > 0) {
    // 2. Try fetching assignments with explicit FK (user_id) - THIS IS THE FIX
    console.log("\n2. Trying explicit FK (user_id) for assignments...");
    const { data: explicitFK, error: explicitError } = await supabase
      .from("duty_assignments")
      .select("*, users!user_id(*)")
      .limit(1);

    if (explicitError) {
      console.error(
        "Explicit FK (user_id) error:",
        JSON.stringify(explicitError, null, 2)
      );
    } else {
      console.log("Explicit FK (user_id) success:", explicitFK?.length);
    }
  } else {
    console.log("No duties found to test joins.");
  }
}

debugDuties();
