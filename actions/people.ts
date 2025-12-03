"use server";

import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";

type FarewellRole = Database["public"]["Enums"]["farewell_role"];

export async function getFarewellMembers(
  farewellId: string,
  role?: FarewellRole,
  grade?: number
) {
  const supabase = await createClient();

  let query = supabase
    .from("farewell_members")
    .select(
      `
      *,
      user:users (
        id,
        full_name,
        avatar_url,
        email,
        status,
        grade,
        section
      )
    `
    )
    .eq("farewell_id", farewellId)
    .eq("status", "approved")
    .order("joined_at", { ascending: false });

  if (role) {
    query = query.eq("role", role);
  }

  // We remove the DB-level grade filter to support filtering in JS
  // This allows us to catch users who have grade in either users or farewell_members
  // if (grade) {
  //   query = query.eq("grade", grade);
  // }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching members:`, JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  // Filter in JS to support grade in either users table or farewell_members table
  if (grade) {
    return data.filter((member) => {
      const userGrade = member.user?.grade;
      const memberGrade = member.grade;
      return userGrade === grade || memberGrade === grade;
    });
  }

  return data;
}

export async function searchFarewellMembers(
  farewellId: string,
  query: string,
  role?: FarewellRole,
  grade?: number
) {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("farewell_members")
    .select(
      `
      *,
      user:users (
        id,
        full_name,
        avatar_url,
        email,
        status,
        grade,
        section
      )
    `
    )
    .eq("farewell_id", farewellId)
    .eq("status", "approved");

  if (role) {
    queryBuilder = queryBuilder.eq("role", role);
  }

  if (grade) {
    // For search, we might want to be more strict or also do JS filtering
    // But search is usually paginated or limited.
    // For now, let's filter in JS to be consistent
    // queryBuilder = queryBuilder.eq("grade", grade);
  }

  if (query) {
    queryBuilder = queryBuilder.ilike("user.full_name", `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error searching members:", error);
    throw new Error("Failed to search members");
  }

  let results = data?.filter((member) => member.user !== null) || [];

  if (grade) {
    results = results.filter((member) => {
      const userGrade = member.user?.grade;
      const memberGrade = member.grade;
      return userGrade === grade || memberGrade === grade;
    });
  }

  return results;
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ...

export async function updateMemberClassAction(
  userId: string,
  grade: number | undefined,
  section: string | undefined,
  fullName: string | undefined,
  role: FarewellRole | undefined,
  farewellId: string
) {
  const supabase = await createClient();

  // 1. Check if current user is admin
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return { error: "Not authenticated" };
  }

  const currentUserId = claimsData.claims.sub;
  console.log("Current User ID:", currentUserId);
  console.log("Farewell ID:", farewellId);

  // Create Admin Client to bypass RLS for both check and update
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing!");
    return { error: "Server configuration error: Missing service role key" };
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Use adminClient to check role (bypassing RLS)
  const { data: adminMember, error: adminError } = await adminClient
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", currentUserId)
    .single();

  console.log("Admin Member Query Result:", adminMember);
  console.log("Admin Member Query Error:", adminError);

  if (
    !adminMember ||
    !["admin", "main_admin", "parallel_admin"].includes(adminMember.role)
  ) {
    console.error("Authorization failed. Role:", adminMember?.role);
    return { error: "Unauthorized" };
  }

  // 2. Update users table (Class details + Name)
  const userUpdates: any = { grade, section };
  if (fullName) userUpdates.full_name = fullName;

  console.log("Updating user:", userId, userUpdates);

  const { error: userError } = await adminClient
    .from("users")
    .update(userUpdates)
    .eq("id", userId);

  if (userError) {
    console.error("Error updating user details:", userError);
    return { error: "Failed to update user details: " + userError.message };
  }

  // 3. Update farewell_members table (Class details + Role)
  const memberUpdates: any = { grade, section };
  if (role) memberUpdates.role = role;

  const { error: memberError } = await adminClient
    .from("farewell_members")
    .update(memberUpdates)
    .eq("user_id", userId)
    .eq("farewell_id", farewellId);

  if (memberError) {
    console.error("Error updating member details:", memberError);
    return { error: "Failed to update member role: " + memberError.message };
  }

  return { success: true };
}
