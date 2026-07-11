import { createAdminClient } from "@/lib/supabase/server";
import { getActivePlanForTenant } from "./plans";

export class QuotaExceededError extends Error {
  constructor() {
    super("Cota de IA do plano esgotada. Faça upgrade em Configurações para continuar.");
    this.name = "QuotaExceededError";
  }
}

/**
 * Single choke point for AI quota enforcement (RF-IA02). Reset is by
 * calendar month (`ai_usage.period`), not the Stripe billing anniversary —
 * deliberate simplification, avoids reconciling two different clocks.
 * Called from lib/ai/orchestrator.ts (covers 6 of 7 AI features) and
 * directly from the streaming tutor chat route (the 7th, which doesn't go
 * through the orchestrator).
 */
export async function checkQuota(tenantId: string): Promise<void> {
  const plan = await getActivePlanForTenant(tenantId);
  const period = new Date().toISOString().slice(0, 7);

  const admin = createAdminClient();
  const { data: usage } = await admin
    .from("ai_usage")
    .select("tokens_used")
    .eq("tenant_id", tenantId)
    .eq("period", period)
    .maybeSingle();

  const tokensUsed = usage?.tokens_used ?? 0;
  if (tokensUsed >= plan.ai_quota_monthly) {
    throw new QuotaExceededError();
  }
}
