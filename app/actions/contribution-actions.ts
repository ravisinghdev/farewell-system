"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionState } from "@/types/custom";

// Schema for validation
const contributionSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  method: z.enum(["upi", "cash", "bank_transfer"]),
  transactionId: z.string().optional(),
  farewellId: z.string().min(1, "Farewell ID is required"),
});

async function isFarewellAdmin(
  supabase: any,
  userId: string,
  farewellId: string
) {
  // Check global role first (optimization)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (
    user?.user_metadata?.role &&
    ["admin", "main_admin", "parallel_admin"].includes(user.user_metadata.role)
  ) {
    return true;
  }

  // Check farewell specific role
  const { data: member } = await supabase
    .from("farewell_members")
    .select("role")
    .eq("farewell_id", farewellId)
    .eq("user_id", userId)
    .single();

  return (
    member?.role === "admin" ||
    member?.role === "main_admin" ||
    member?.role === "parallel_admin"
  );
}

export async function createContributionAction(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // 2. Parse data
  const rawData = {
    amount: formData.get("amount"),
    method: formData.get("method"),
    transactionId: formData.get("transactionId"),
    farewellId: formData.get("farewellId"),
  };

  const parsed = contributionSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { amount, method, transactionId, farewellId } = parsed.data;
  const file = formData.get("screenshot") as File | null;
  let screenshotUrl: string | null = null;

  // 3. Handle File Upload (if present)
  if (file && file.size > 0) {
    // Basic validation
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 5MB" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${farewellId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload screenshot" };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);

    screenshotUrl = publicUrlData.publicUrl;
  }

  // 4. Insert into DB
  const { error: insertError } = await supabase.from("contributions").insert({
    user_id: user.id,
    farewell_id: farewellId,
    amount,
    method: method as "upi" | "cash" | "bank_transfer",
    transaction_id: transactionId || null,
    screenshot_url: screenshotUrl,
    status: "pending",
  });

  if (insertError) {
    console.error("Insert contribution error:", insertError);
    return { error: "Failed to save contribution" };
  }

  revalidatePath(`/dashboard/${farewellId}/contributions`);
  return { success: true };
}

export async function getContributionsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch contributions error:", error);
    return [];
  }

  return data;
}

export async function getAllContributionsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const authorized = await isFarewellAdmin(supabase, user.id, farewellId);
  if (!authorized) return [];

  // Use admin client to bypass RLS for farewell admins
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("*, users:user_id(full_name, avatar_url)")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch all contributions error:", error);
    return [];
  }

  return data;
}

export async function updateContributionStatusAction(
  contributionId: string,
  status: "verified" | "rejected"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Need to fetch contribution to get farewell_id to check permissions
  const { data: contribution } = await supabaseAdmin
    .from("contributions")
    .select("farewell_id")
    .eq("id", contributionId)
    .single();

  if (!contribution) return { error: "Contribution not found" };

  const authorized = await isFarewellAdmin(
    supabase,
    user.id,
    contribution.farewell_id
  );
  if (!authorized) return { error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("contributions")
    .update({ status })
    .eq("id", contributionId);

  if (error) {
    console.error("Update contribution status error:", error);
    return { error: "Failed to update status" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getContributionStatsAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { total: 0 };

  const authorized = await isFarewellAdmin(supabase, user.id, farewellId);
  if (!authorized) return { total: 0 };

  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("amount")
    .eq("farewell_id", farewellId)
    .eq("status", "verified");

  if (error) {
    console.error("Fetch stats error:", error);
    return { total: 0 };
  }

  const total = data.reduce((sum, c) => sum + Number(c.amount), 0);
  return { total };
}

export async function getLeaderboardAction(farewellId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch all verified contributions with user details
  // We use admin client to get everyone's data for the leaderboard
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select(
      "amount, user_id, users!contributions_user_id_fkey(full_name, avatar_url)"
    )
    .eq("farewell_id", farewellId)
    .eq("status", "verified");

  if (error) {
    console.error("Fetch leaderboard error:", error);
    return [];
  }

  // Aggregate by user
  const leaderboardMap = new Map<
    string,
    { userId: string; name: string; avatar: string; amount: number }
  >();

  data.forEach((c: any) => {
    if (!c.user_id) return;

    const current = leaderboardMap.get(c.user_id) || {
      userId: c.user_id,
      name: c.users?.full_name || "Anonymous",
      avatar: c.users?.avatar_url || "",
      amount: 0,
    };

    current.amount += Number(c.amount);
    leaderboardMap.set(c.user_id, current);
  });

  // Convert to array and sort
  return Array.from(leaderboardMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 50); // Top 50
}
