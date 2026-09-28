import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { isDevMockEnabled } from "@/lib/auth-helpers";

function getStripeInstance(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes("placeholder")) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Development mock bypass (strictly restricted to local dev with ENABLE_DEV_MOCKS=true)
  if (isDevMockEnabled() && (!webhookSecret || webhookSecret.includes("placeholder") || !signature)) {
    try {
      const parsed = JSON.parse(body);
      const placementId =
        parsed?.data?.object?.client_reference_id ||
        parsed?.data?.object?.metadata?.placementId;

      return NextResponse.json({
        received: true,
        mode: "mock_development_acknowledged",
        placementId,
      });
    } catch {
      return NextResponse.json({ received: true, mode: "mock_pass" });
    }
  }

  // Production Stripe Webhook Signature Verification
  if (!webhookSecret || webhookSecret.includes("placeholder")) {
    console.error("Stripe Webhook Error: STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured on server." },
      { status: 500 }
    );
  }

  if (!signature) {
    console.error("Stripe Webhook Error: Missing stripe-signature header.");
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const stripe = getStripeInstance();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe service is not configured." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error(`Stripe Webhook Verification Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Handle successful deposit checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const placementId =
      session.client_reference_id || session.metadata?.placementId;

    if (placementId) {
      console.log(`Stripe Escrow Deposit verified for Placement: ${placementId}`);
      try {
        const adminSupabase = createAdminClient();
        const { error: updateError } = await adminSupabase
          .from("placements")
          .update({
            stage: "Placed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", placementId);

        if (updateError) {
          console.error("Failed to update placement status in DB:", updateError.message);
          return NextResponse.json(
            { error: "Database update failed" },
            { status: 500 }
          );
        }
      } catch (dbErr) {
        console.error("Database connection error in webhook:", dbErr);
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
