import { createAdminClient } from "@/lib/supabase/server";
import { getAIProvider } from "./registry";
import { checkQuota } from "@/lib/billing/quota";
import type { AITask, ChatMessage } from "./types";

interface OrchestrateArgs {
  task: AITask;
  schema: Record<string, unknown>;
  input: unknown;
  tenantId: string;
  userId: string;
}

export class AIProviderError extends Error {
  constructor(providerId: string, cause: unknown) {
    super(`Falha no provider de IA "${providerId}".`, { cause });
    this.name = "AIProviderError";
  }
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
 * Single choke point for every non-streaming AI call in the app. Checks the
 * tenant's AI quota (RF-IA02), resolves the active provider, calls it, and
 * logs usage via `logAIUsage`. Fallback/cache land in later phases.
 */
export async function generateStructured<T>(args: OrchestrateArgs): Promise<T> {
  const provider = getAIProvider();
  if (provider.metered !== false) await checkQuota(args.tenantId);
  const startedAt = Date.now();

  let result;
  try {
    result = await provider.generateStructured<T>({
      task: args.task,
      schema: args.schema,
      input: args.input,
    });
  } catch (cause) {
    throw new AIProviderError(provider.id, cause);
  }
  const { data, tokensIn, tokensOut } = result;

  const latencyMs = Date.now() - startedAt;

  if (provider.metered !== false) {
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
  }

  return data;
}

interface StreamGenerateArgs {
  task: AITask;
  messages: ChatMessage[];
  context?: string;
  tenantId: string;
  userId: string;
}

/**
 * Streaming choke point — the `streamChat` counterpart to `generateStructured`.
 * Checks quota eagerly (fails before any token is yielded, matching
 * `generateStructured`'s "reject before doing any work" behavior), then
 * streams tokens through to the caller while accumulating them, and logs
 * usage once the stream ends (in a `finally`, so it also fires if the
 * consumer breaks out of the `for await` early — same as a generator's
 * `.return()` being called on early exit).
 */
export async function streamGenerate(args: StreamGenerateArgs): Promise<AsyncIterable<string>> {
  await checkQuota(args.tenantId);

  const provider = getAIProvider();
  const startedAt = Date.now();
  let usage = { tokensIn: 0, tokensOut: 0 };
  let output = "";

  async function* wrapped() {
    try {
      for await (const token of provider.streamChat({
        messages: args.messages,
        context: args.context,
        onUsage: (u) => {
          usage = u;
        },
      })) {
        output += token;
        yield token;
      }
    } finally {
      await logAIUsage({
        tenantId: args.tenantId,
        userId: args.userId,
        feature: args.task,
        provider: provider.id,
        input: { messages: args.messages },
        output: { response: output },
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        latencyMs: Date.now() - startedAt,
      });
    }
  }

  return wrapped();
}

interface EmbedTextsArgs {
  texts: string[];
  tenantId: string;
  userId?: string;
  feature: AITask;
}

/**
 * Embedding choke point — closes the gap where the tutor's RAG query embed
 * and `ingestMaterial`'s bulk embed were both invisible to quota/logging
 * (calling `provider.embed()` directly, outside `generateStructured`).
 * `tokensIn`/`tokensOut` are logged as 0: none of the current providers
 * (mock/echo/anthropic) have a real embeddings cost today — see
 * `lib/ai/providers/anthropic.ts`'s own comment on why `embed()` is a
 * placeholder hash, not an API call. This is a different, currently-correct
 * zero, not the same bug `streamGenerate` fixes for `streamChat`.
 */
export async function embedTexts(args: EmbedTextsArgs): Promise<number[][]> {
  await checkQuota(args.tenantId);

  const provider = getAIProvider();
  const startedAt = Date.now();
  const embeddings = await provider.embed({ texts: args.texts });

  await logAIUsage({
    tenantId: args.tenantId,
    userId: args.userId,
    feature: args.feature,
    provider: provider.id,
    input: { texts: args.texts.length },
    tokensIn: 0,
    tokensOut: 0,
    latencyMs: Date.now() - startedAt,
  });

  return embeddings;
}
