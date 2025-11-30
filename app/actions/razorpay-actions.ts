"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import Razorpay from "razorpay";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createOrderAction(farewellId: string, amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}_${user.id.slice(0, 5)}`,
      notes: {
        userId: user.id,
        farewellId: farewellId,
      },
    };

    const order = await razorpay.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err: any) {
    console.error("Razorpay Order Creation Error:", err);
    return { error: err.message || "Failed to create order" };
  }
}

export async function verifyPaymentAction(
  farewellId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  amount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpaySignature) {
      // Payment is successful

      // Check if contribution already exists to avoid duplicates
      const { data: existing } = await supabase
        .from("contributions")
        .select("id")
        .eq("transaction_id", razorpayPaymentId)
        .single();

      if (existing) {
        return { success: true, alreadyProcessed: true };
      }

      // Fetch full payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpayPaymentId);

      // Insert contribution
      const { error } = await supabase.from("contributions").insert({
        user_id: user.id,
        farewell_id: farewellId,
        amount: amount, // Amount in rupees
        method: "razorpay",
        transaction_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        status: "verified",
        metadata: {
          email: payment.email,
          contact: payment.contact,
          method: payment.method,
          wallet: payment.wallet,
          vpa: payment.vpa,
          invoice_id: payment.invoice_id,
          bank: payment.bank,
          card_id: payment.card_id,
          fee: payment.fee,
          tax: payment.tax,
          created_at: payment.created_at,
        },
      });

      if (error) {
        console.error("DB Insert Error:", error);
        return { error: "Failed to record contribution" };
      }

      revalidatePath(`/dashboard/${farewellId}/contributions`);
      return { success: true };
    } else {
      return { error: "Invalid signature" };
    }
  } catch (err: any) {
    console.error("Verify Payment Error:", err);
    return { error: err.message };
  }
}
