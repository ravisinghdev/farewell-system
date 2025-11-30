import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json(
        { error: "Missing signature or secret" },
        { status: 400 }
      );
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const farewellId = session.metadata?.farewellId;
      const userId = session.metadata?.userId;
      const amount = (session.amount_total || 0) / 100;
      const sessionId = session.id;
      const paymentIntentId = session.payment_intent as string;

      if (farewellId && userId) {
        // Check if contribution already exists (idempotency)
        const { data: existing } = await supabaseAdmin
          .from("contributions")
          .select("id")
          .eq("stripe_session_id", sessionId)
          .single();

        if (!existing) {
          const { error } = await supabaseAdmin.from("contributions").insert({
            user_id: userId,
            farewell_id: farewellId,
            amount: amount,
            method: "stripe",
            transaction_id: paymentIntentId,
            stripe_session_id: sessionId,
            status: "verified",
          });

          if (error) {
            console.error("Error inserting contribution:", error);
            return NextResponse.json(
              { error: "Database insertion failed" },
              { status: 500 }
            );
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
