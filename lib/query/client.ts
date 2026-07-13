import { cache } from "react";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";

/**
 * Padrão oficial TanStack para App Router (decisão nº 5 do ADR):
 * Server Components fazem prefetch num QueryClient POR REQUEST (React
 * cache() garante 1 instância por render de servidor — nunca compartilhar
 * entre requests, vazaria dados entre usuários) e entregam o cache
 * desidratado via <HydrationBoundary>. No client, useQuery assume como
 * fonte única (refetch/invalidations), refazendo via route handlers.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Evita refetch imediato no mount logo após a hidratação — o dado
        // acabou de sair do servidor.
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // Inclui queries ainda em voo (suporta streaming de prefetch).
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

/** Server-side: um QueryClient por request. Use em Server Components/layouts. */
export const getQueryClient = cache(makeQueryClient);
