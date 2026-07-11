import { createAdminClient } from "@/lib/supabase/server";

export type PlanCode = "FREE" | "PROFESSOR" | "ALUNO" | "ESCOLA";

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  ai_quota_monthly: number;
  price_cents: number;
  stripe_price_id: string | null;
}

export interface TenantSubscription {
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  current_period_end: string | null;
  stripe_customer_id: string | null;
  plan: Plan;
}

/**
 * Resolves the plan actually governing a tenant's quota/features right now.
 * A subscription that isn't TRIALING/ACTIVE (past due, canceled) falls back
 * to the FREE plan's limits rather than blocking outright — the app stays
 * usable, just downgraded, same as most SaaS billing behavior.
 */
export async function getActivePlanForTenant(tenantId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, plan:plans(id, code, name, ai_quota_monthly, price_cents, stripe_price_id)")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (sub && (sub.status === "ACTIVE" || sub.status === "TRIALING") && sub.plan) {
    return sub.plan as unknown as Plan;
  }

  const { data: free } = await admin.from("plans").select("*").eq("code", "FREE").single();
  return free as Plan;
}

/** Full subscription + plan, for display (Configurações). Null if somehow missing (pre-migration tenant not yet backfilled). */
export async function getSubscriptionForTenant(tenantId: string): Promise<TenantSubscription | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status, current_period_end, stripe_customer_id, plan:plans(id, code, name, ai_quota_monthly, price_cents, stripe_price_id)")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!data) return null;
  return data as unknown as TenantSubscription;
}

export async function listPlans(): Promise<Plan[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("plans").select("*").order("price_cents");
  return (data ?? []) as Plan[];
}
