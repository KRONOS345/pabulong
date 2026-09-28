"use server";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isDevMockEnabled, getAuthenticatedUserId } from "@/lib/auth-helpers";

function getStripeInstance(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes("placeholder") || !secretKey.startsWith("sk_")) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  });
}

export interface DepositCheckoutResult {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  isMock: boolean;
  message: string;
}

/**
 * Creates a Stripe Checkout Session for student room security deposit escrow.
 */
export async function createDepositCheckoutSession(params: {
  placementId: string;
  clientName: string;
  clientEmail: string;
  roomName: string;
  monthlyRent: number;
}): Promise<DepositCheckoutResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      isMock: false,
      message: "Unauthorized: Please sign in.",
    };
  }

  const depositAmount = params.monthlyRent;
  const depositCents = Math.round(depositAmount * 100);
  const stripe = getStripeInstance();

  // If live Stripe keys are not configured
  if (!stripe) {
    if (isDevMockEnabled()) {
      const mockSessionId = `mock_cs_${Date.now()}`;
      const mockUrl = `/dashboard/placements?deposit_confirmed=true&placement_id=${params.placementId}&session_id=${mockSessionId}&amount=${depositAmount}`;

      return {
        success: true,
        sessionId: mockSessionId,
        checkoutUrl: mockUrl,
        isMock: true,
        message: "Sandbox Escrow Checkout Initialized (Live Stripe Secret Key not detected).",
      };
    }

    return {
      success: false,
      isMock: false,
      message: "Payment escrow service is currently unavailable. Please contact the administrator.",
    };
  }

  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      client_reference_id: params.placementId,
      customer_email: params.clientEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Room Security Deposit: ${params.roomName}`,
              description: `Escrow Security Deposit for tenant candidate ${params.clientName}. Refundable upon lease completion.`,
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        placementId: params.placementId,
        clientName: params.clientName,
        roomName: params.roomName,
        transactionType: "security_deposit_escrow",
        initiatedBy: userId,
      },
      success_url: `${origin}/dashboard/placements?deposit_confirmed=true&placement_id=${params.placementId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/placements?deposit_cancelled=true&placement_id=${params.placementId}`,
    });

    return {
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url || undefined,
      isMock: false,
      message: "Stripe Escrow Checkout Session created successfully.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("Stripe Checkout Error:", err);
    return {
      success: false,
      isMock: false,
      message,
    };
  }
}

/**
 * Verifies deposit payment status authoritatively against Stripe and transitions placement to "Placed".
 * Never relies on client-supplied parameters alone.
 */
export async function verifyAndSettleDeposit(params: {
  placementId: string;
  sessionId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const stripe = getStripeInstance();

    // In local dev mock mode without Stripe keys
    if (!stripe) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/placements");
        return { success: true };
      }
      return { success: false, error: "Stripe service is not configured." };
    }

    // In production, verify session authenticity directly with Stripe
    if (!params.sessionId || params.sessionId.startsWith("mock_")) {
      if (isDevMockEnabled()) {
        return { success: true };
      }
      return { success: false, error: "Invalid checkout session ID." };
    }

    const session = await stripe.checkout.sessions.retrieve(params.sessionId);

    if (
      session.payment_status !== "paid" ||
      session.client_reference_id !== params.placementId
    ) {
      return {
        success: false,
        error: "Deposit payment has not been verified by Stripe.",
      };
    }

    // Authoritative update via Admin Client
    const adminSupabase = createAdminClient();
    const { error: dbError } = await adminSupabase
      .from("placements")
      .update({
        stage: "Placed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.placementId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    revalidatePath("/dashboard/placements");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return { success: false, error: message };
  }
}
