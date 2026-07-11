"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripeClient } from "./stripe";
import type { PlanCode } from "./plans";

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function requireTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("tenant_id, full_name").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  return { userId: user.id, email: user.email ?? undefined, ...profile };
}

export type BillingActionResult = { error: string } | undefined;

/**
 * Creates a Stripe Checkout Session for the given plan and redirects to it.
 * Reuses the tenant's existing Stripe customer if one was already created
 * by a previous checkout; otherwise Stripe creates one during checkout and
 * the webhook (checkout.session.completed) persists it.
 *
 * Returns `{error}` instead of throwing for expected failures (no Stripe
 * key yet, plan not priced) — Next.js redacts thrown Server Action error
 * messages in production builds ("The specific message is omitted..."),
 * which would silently swallow exactly the friendly message the TBD-key
 * plan promises. Returning it as data sidesteps that redaction.
 */
export async function createCheckoutSession(planCode: PlanCode, returnPath: string): Promise<BillingActionResult> {
  const { tenant_id, email } = await requireTenant();

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  const admin = createAdminClient();
  const [{ data: plan }, { data: sub }, base] = await Promise.all([
    admin.from("plans").select("id, stripe_price_id").eq("code", planCode).single(),
    admin.from("subscriptions").select("stripe_customer_id").eq("tenant_id", tenant_id).maybeSingle(),
    origin(),
  ]);

  if (!plan?.stripe_price_id) {
    return { error: `O plano "${planCode}" ainda não tem um preço configurado no Stripe (defina em /admin/planos).` };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : email,
    client_reference_id: tenant_id,
    success_url: `${base}${returnPath}?checkout=sucesso`,
    cancel_url: `${base}${returnPath}?checkout=cancelado`,
  });

  if (!session.url) return { error: "Não foi possível iniciar o checkout." };
  redirect(session.url);
}

/** Opens the Stripe Billing Portal for the tenant's existing customer. Same {error}-return rationale as createCheckoutSession. */
export async function createPortalSession(returnPath: string): Promise<BillingActionResult> {
  const { tenant_id } = await requireTenant();

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  const admin = createAdminClient();
  const [{ data: sub }, base] = await Promise.all([
    admin.from("subscriptions").select("stripe_customer_id").eq("tenant_id", tenant_id).maybeSingle(),
    origin(),
  ]);

  if (!sub?.stripe_customer_id) {
    return { error: "Você ainda não tem uma assinatura paga para gerenciar." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${base}${returnPath}`,
  });

  redirect(session.url);
}
