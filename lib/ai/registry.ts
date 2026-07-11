import type { AIProvider } from "./provider";
import { mockProvider } from "./providers/mock";
import { echoProvider } from "./providers/echo";
import { anthropicProvider } from "./providers/anthropic";

/**
 * Provider registry. `AI_PROVIDER` env var selects the active one; defaults
 * to `mock` (no key required). Adding a real adapter later is just another
 * entry here, never a change to call sites — proven by `anthropic`, the
 * first real adapter, requiring zero changes anywhere else in the app
 * (just AI_PROVIDER=anthropic + ANTHROPIC_API_KEY in the environment).
 *
 * `echo` is a second, independently-implemented deterministic provider that
 * exists purely to prove the abstraction isn't secretly coupled to `mock`'s
 * internals (Fase 6) — set AI_PROVIDER=echo and every generated artifact's
 * shape/wording changes without touching any route or UI.
 */
const PROVIDERS: Record<string, AIProvider> = {
  mock: mockProvider,
  echo: echoProvider,
  anthropic: anthropicProvider,
};

export function getAIProvider(): AIProvider {
  const id = process.env.AI_PROVIDER || "mock";
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(
      `Provedor de IA desconhecido: "${id}". Disponíveis: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  return provider;
}
