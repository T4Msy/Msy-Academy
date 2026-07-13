"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/client";

/**
 * Provider do TanStack Query no browser. useState (e não singleton de
 * módulo) para o client sobreviver a Fast Refresh sem estado duplicado,
 * e nunca ser criado durante o render de servidor de outra request.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
