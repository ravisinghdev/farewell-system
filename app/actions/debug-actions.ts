"use server";

import { createClient } from "@supabase/supabase-js";

export async function testPermissionsAction() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const checks = {
    hasServiceKey: !!serviceKey,
    hasAnonKey: !!anonKey,
    hasUrl: !!url,
    keysDistinct: serviceKey !== anonKey,
    serviceKeyLength: serviceKey?.length || 0,
  };

  if (!serviceKey || !url) {
    return { success: false, checks, error: "Missing Env Vars" };
  }

  try {
    // 1. Create Layout Client (Admin)
    const supabase = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Test Read (should bypass RLS)
    const { data: readData, error: readError } = await supabase
      .from("rehearsal_sessions")
      .select("id")
      .limit(1);

    if (readError) {
      return {
        success: false,
        checks,
        error: `Read Query Failed: ${readError.message}`,
        details: readError,
      };
    }

    // 3. Test Write (should bypass RLS) - Use a dummy ID that likely won't match, just checking PERMISSION
    const dummyId = "00000000-0000-0000-0000-000000000000";
    const { error: writeError } = await supabase
      .from("rehearsal_sessions")
      .update({ venue: "Debug Test Venue" }) // Use a standard column, not 'attendance' initially
      .eq("id", dummyId);

    if (writeError) {
      return {
        success: false,
        checks,
        error: `Write Query Failed: ${writeError.message}`,
        details: writeError,
      };
    }

    // 4. Test Column Existence (attendance)
    // We try to update the 'attendance' column specifically to see if THAT triggers the error
    const { error: columnError } = await supabase
      .from("rehearsal_sessions")
      .update({ attendance: {} })
      .eq("id", dummyId);

    if (columnError) {
      return {
        success: false,
        checks,
        error: `Column specific write failed (attendance): ${columnError.message}`,
        details: columnError,
      };
    }

    return {
      success: true,
      checks,
      message: "All Checks Passed. Admin Client has full access.",
    };
  } catch (e: any) {
    return { success: false, checks, error: `Exception: ${e.message}` };
  }
}
