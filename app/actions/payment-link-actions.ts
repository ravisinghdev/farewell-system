"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";
import { checkIsAdmin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export interface CreatePaymentLinkData {
  farewellId: string;
  amount: number;
  title: string;
  description?: string;
  slug?: string;
}

export async function createPaymentLinkAction(data: CreatePaymentLinkData) {
  const user = await getCurrentUserWithRole(data.farewellId);
  if (!user || !checkIsAdmin(user.role)) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { data: link, error } = await supabase
    .from("payment_links")
    .insert({
      farewell_id: data.farewellId,
      amount: data.amount,
      title: data.title,
      description: data.description,
      status: "active",
      created_by: user.id,
      slug: data.slug || undefined,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating payment link:", error);
    return { error: "Failed to create payment link" };
  }

  revalidatePath(`/dashboard/${data.farewellId}/admin/payments`);
  return { success: true, link };
}

export async function getPaymentLinksAction(farewellId: string) {
  const user = await getCurrentUserWithRole(farewellId);
  if (!user || !checkIsAdmin(user.role)) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payment links:", error);
    return { error: "Failed to fetch payment links" };
  }

  return { success: true, links };
}

export async function togglePaymentLinkStatusAction(
  linkId: string,
  farewellId: string,
  newStatus: "active" | "inactive" | "archived"
) {
  const user = await getCurrentUserWithRole(farewellId);
  if (!user || !checkIsAdmin(user.role)) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_links")
    .update({ status: newStatus })
    .eq("id", linkId);

  if (error) {
    console.error("Error updating payment link:", error);
    return { error: "Failed to update link" };
  }

  revalidatePath(`/dashboard/${farewellId}/admin/payments`);
  return { success: true };
}

export async function getPublicPaymentLinkAction(linkId: string) {
  const supabase = await createClient();

  // Try to find by ID first
  let query = supabase
    .from("payment_links")
    .select("*, farewells(name)") // Join farewell name if possible, or fetch separately
    .eq("status", "active");

  // Check if linkId is UUID
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      linkId
    );

  if (isUuid) {
    query = query.eq("id", linkId);
  } else {
    query = query.eq("slug", linkId);
  }

  const { data: link, error } = await query.single();

  if (error || !link) {
    return { error: "Payment link not found or inactive" };
  }

  return { success: true, link };
}
