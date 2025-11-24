"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for validation
const contributionSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  method: z.enum(["upi", "cash", "bank_transfer"]),
  transactionId: z.string().optional(),
  farewellId: z.string().min(1, "Farewell ID is required"),
});

export async function createContributionAction(formData: FormData) {
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
      // Proceeding without screenshot if upload fails is risky, let's fail.
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
    .select("*")
    .eq("farewell_id", farewellId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch contributions error:", error);
    return [];
  }

  return data;
}
