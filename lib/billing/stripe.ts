import Stripe from "stripe";

/**
 * Lazy Stripe client — reads STRIPE_SECRET_KEY only when actually called,
 * not at module load. Keeping it out of lib/env.ts's eager schema means the
 * app boots fine before the key is configured; only billing actions fail,
 * with a clear message, until it's set (same TBD-key pattern as the AI
 * provider in lib/ai/registry.ts).
 */
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe não configurado — defina STRIPE_SECRET_KEY para habilitar pagamentos.");
  }
  return new Stripe(key);
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Stripe não configurado — defina STRIPE_WEBHOOK_SECRET.");
  }
  return secret;
}
