import { Ratelimit } from "@upstash/ratelimit";
// "/cloudflare" (not the default "/node" export) — this module is imported
// from both Edge middleware and Node route handlers/Server Actions. The
// default export uses Node-only APIs (process.version) for platform
// detection that break under the Edge runtime; the cloudflare build is pure
// fetch, so it works in both without a second, runtime-conditional import.
import { Redis } from "@upstash/redis/cloudflare";

/**
 * Rate limiting por requisição (docs/13-adr-revisao-arquitetural-2026-07.md,
 * Fase 4). Complementa `lib/billing/quota.ts` (cota mensal, sem throttle por
 * minuto) — sem isto, um script em loop gera custo real de IA repetidamente
 * dentro do mesmo mês sem nunca ser barrado até a cota inteira estourar.
 *
 * Diferente de `getStripeClient()` (lib/billing/stripe.ts), que FALHA sem a
 * credencial porque billing não funciona sem Stripe: aqui a ausência de
 * UPSTASH_REDIS_REST_URL/TOKEN faz `checkRateLimit` sempre retornar sucesso
 * (no-op) — rate limiting é uma camada extra, opcional por design; nunca deve
 * derrubar geração de IA, login ou busca só porque a conta Upstash ainda não
 * foi configurada (mesmo espírito do AI_PROVIDER=mock).
 */
export type RatelimitCategory = "ai" | "tutor-chat" | "auth" | "search";

const LIMITS: Record<RatelimitCategory, { requests: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  // Geração de IA (exames/atividades/planos de aula/flashcards/plano de
  // estudos/regeneração de questão/correção sugerida/ingestão de material):
  // generoso o bastante para não barrar um professor gerando várias questões
  // seguidas, mas fecha a lacuna de um script disparando requisições em loop.
  ai: { requests: 10, window: "1 m" },
  // Chat do tutor tem bucket próprio: cada mensagem de conversa é um POST
  // separado, então o mesmo limite de "ai" seria apertado demais para uma
  // conversa ativa.
  "tutor-chat": { requests: 20, window: "1 m" },
  // Login/signup/recuperação de senha, por IP: janela mais longa porque
  // abuso de auth é tipicamente sustentado/scriptado, não uma rajada isolada.
  auth: { requests: 5, window: "10 m" },
  // Busca global: sem custo de IA, o risco aqui é carga no Postgres por um
  // loop de debounce quebrado no client, não abuso — limite mais folgado.
  search: { requests: 30, window: "1 m" },
};

let limiters: Partial<Record<RatelimitCategory, Ratelimit>> | null = null;

function getLimiters(): Partial<Record<RatelimitCategory, Ratelimit>> {
  if (limiters) return limiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiters = {};
    return limiters;
  }

  const redis = new Redis({ url, token });
  limiters = Object.fromEntries(
    (Object.entries(LIMITS) as [RatelimitCategory, (typeof LIMITS)[RatelimitCategory]][]).map(
      ([category, { requests, window }]) => [
        category,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(requests, window),
          prefix: `ratelimit:${category}`,
        }),
      ],
    ),
  ) as Record<RatelimitCategory, Ratelimit>;
  return limiters;
}

/**
 * Nunca lança. Sem credenciais Upstash configuradas, retorna sempre
 * `{ success: true }` (no-op) — ver comentário do módulo. `key` é
 * responsabilidade do chamador: user id (autenticado) para `ai`/`tutor-chat`/
 * `search`, IP para `auth`.
 */
export async function checkRateLimit(
  category: RatelimitCategory,
  key: string,
): Promise<{ success: boolean; retryAfterSeconds?: number }> {
  const limiter = getLimiters()[category];
  if (!limiter) return { success: true };

  const result = await limiter.limit(key);
  if (result.success) return { success: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { success: false, retryAfterSeconds };
}
