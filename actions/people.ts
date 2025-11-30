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
        status
      )
    `
    )
    .eq("farewell_id", farewellId)
    .eq("status", "approved")
    .order("joined_at", { ascending: false });

  if (role) {
    query = query.eq("role", role);
  }

  if (grade) {
    query = query.eq("grade", grade);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching members:`, JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch members: ${error.message}`);
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
        status
      )
    `
    )
    .eq("farewell_id", farewellId)
    .eq("status", "approved");

  if (role) {
    queryBuilder = queryBuilder.eq("role", role);
  }

  if (grade) {
    queryBuilder = queryBuilder.eq("grade", grade);
  }

  if (query) {
    queryBuilder = queryBuilder.ilike("user.full_name", `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error searching members:", error);
    throw new Error("Failed to search members");
  }

  return data?.filter((member) => member.user !== null) || [];
}
