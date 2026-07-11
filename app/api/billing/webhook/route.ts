import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook — the only billing route that must be a raw HTTP handler
 * (Stripe calls it directly and verifies delivery via signature). Everything
 * else in lib/billing/actions.ts is a server action. Writes always go
 * through the admin client — a webhook has no authenticated Supabase user.
 */
export async function POST(request: Request) {
  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();
    if (!signature) return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook inválido: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!tenantId || !customerId || !subscriptionId) break;

      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const { data: plan } = await admin.from("plans").select("id").eq("stripe_price_id", priceId).maybeSingle();
      if (!plan) break;

      await admin.from("subscriptions").upsert(
        {
          tenant_id: tenantId,
          plan_id: plan.id,
          status: "ACTIVE",
          current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        },
        { onConflict: "tenant_id" },
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" ? "ACTIVE" : subscription.status === "past_due" ? "PAST_DUE" : subscription.status === "trialing" ? "TRIALING" : "CANCELED";
      await admin
        .from("subscriptions")
        .update({
          status,
          current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: free } = await admin.from("plans").select("id").eq("code", "FREE").single();
      if (free) {
        await admin
          .from("subscriptions")
          .update({ status: "CANCELED", plan_id: free.id })
          .eq("stripe_subscription_id", subscription.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
