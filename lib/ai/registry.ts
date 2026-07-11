import type { AIProvider } from "./provider";
import { mockProvider } from "./providers/mock";
import { echoProvider } from "./providers/echo";

/**
 * Provider registry. `AI_PROVIDER` env var selects the active one; defaults
 * to `mock` (no key required) until a real provider is chosen — see the
 * "Pré-requisitos externos" section of the Fase 0+ plan. Adding a real
 * adapter later is just another entry here, never a change to call sites.
 *
 * `echo` is a second, independently-implemented deterministic provider that
 * exists purely to prove the abstraction isn't secretly coupled to `mock`'s
 * internals (Fase 6) — set AI_PROVIDER=echo and every generated artifact's
 * shape/wording changes without touching any route or UI.
 */
const PROVIDERS: Record<string, AIProvider> = {
  mock: mockProvider,
  echo: echoProvider,
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
