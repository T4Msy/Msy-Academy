import { createAdminClient } from "@/lib/supabase/server";
import { getAIProvider } from "./registry";
import type { AITask } from "./types";

interface OrchestrateArgs {
  task: AITask;
  schema: Record<string, unknown>;
  input: unknown;
  tenantId: string;
  userId: string;
}

/** Logs an ai_interactions row and increments the tenant's ai_usage for the current period (YYYY-MM). Server-only (admin client) — mirrors the write discipline of both tables (no client insert policy on either). */
export async function logAIUsage(args: {
  tenantId: string;
  userId?: string;
  feature: AITask;
  provider: string;
  input?: unknown;
  output?: unknown;
  tokensIn: number;
  tokensOut: number;
  latencyMs?: number;
}): Promise<void> {
  const admin = createAdminClient();
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  await Promise.all([
    admin.from("ai_interactions").insert({
      tenant_id: args.tenantId,
      user_id: args.userId,
      feature: args.feature,
      provider: args.provider,
      input: args.input as object,
      output: args.output as object,
      tokens_in: args.tokensIn,
      tokens_out: args.tokensOut,
      latency_ms: args.latencyMs,
    }),
    admin.rpc("increment_ai_usage", {
      p_tenant_id: args.tenantId,
      p_period: period,
      p_tokens: args.tokensIn + args.tokensOut,
    }),
  ]);
}

/**
 * Single choke point for every non-streaming AI call in the app. Resolves
 * the active provider, calls it, and logs usage via `logAIUsage`. Cota
 * enforcement/fallback/cache land in later phases; this is the embryo the
 * plan calls for.
 */
export async function generateStructured<T>(args: OrchestrateArgs): Promise<T> {
  const provider = getAIProvider();
  const startedAt = Date.now();

  const { data, tokensIn, tokensOut } = await provider.generateStructured<T>({
    task: args.task,
    schema: args.schema,
    input: args.input,
  });

  const latencyMs = Date.now() - startedAt;

  await logAIUsage({
    tenantId: args.tenantId,
    userId: args.userId,
    feature: args.task,
    provider: provider.id,
    input: args.input,
    output: data,
    tokensIn,
    tokensOut,
    latencyMs,
  });

  return data;
}
