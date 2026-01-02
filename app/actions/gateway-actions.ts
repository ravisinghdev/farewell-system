"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/utils/supabase/admin";

export async function createGatewayOrderAction(
  farewellId: string,
  amount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { data, error } = await supabase
      .from("payment_orders")
      .insert({
        farewell_id: farewellId,
        user_id: user.id,
        amount: amount,
        status: "pending",
        gateway_provider: "internal",
      })
      .select()
      .single();

    if (error) {
      console.error("Order Creation Error:", error);
      return { error: "Failed to create payment order" };
    }

    return {
      success: true,
      orderId: data.id,
      redirectUrl: `/dashboard/${farewellId}/contributions/payment/gateway?orderId=${data.id}`,
    };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function verifyGatewayOrderAction(
  orderId: string,
  method: string,
  utr?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    // 1. Mark Order as Paid (or 'manual_check' if we want to distinguish)
    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .update({
        status: "paid",
        // We can store the UTR in metadata for reference
        metadata: utr ? { utr: utr, method: method } : undefined,
      })
      .eq("id", orderId)
      // .eq("user_id", user.id) // RLS policy handles this check now
      .select()
      .single();

    if (orderError || !order) {
      console.error("Verify Order Error:", orderError); // DEBUG LOG
      return {
        error:
          "Failed to verify order: " +
          (orderError?.message || "Order not found or access denied"),
      };
    }

    // 2. Create the Actual Contribution
    // Use the provided UTR or generate one if missing (shouldn't happen in manual flow)
    const txnId =
      utr || `INT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { error: contribError } = await supabase
      .from("contributions")
      .insert({
        user_id: user.id,
        farewell_id: order.farewell_id,
        amount: order.amount,
        method: method, // 'card', 'upi', 'netbanking'
        transaction_id: txnId,
        status: "verified", // We auto-verify trustworthy users or manual inputs for now, can change to 'pending' if strict
        metadata: {
          source: "internal_gateway",
          order_id: orderId,
          utr: txnId,
        },
      });

    if (contribError) {
      console.error("Contribution Error:", contribError);
      return {
        error:
          "Payment captured but contribution record failed. Contact support.",
      };
    }

    revalidatePath(`/dashboard/${order.farewell_id}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getGatewayOrderAction(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*, farewells(name)")
    .eq("id", orderId)
    .single();

  if (error) return { error: "Order not found" };
  return { order: data };
}

// NEW: Real Polling Action
export async function checkGatewayOrderStatusAction(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (error || !data) return { status: "unknown" };
  return { status: data.status };
}
