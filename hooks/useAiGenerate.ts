"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Fluxo padrão de geração por IA no client (decisão nº 15 do ADR 13):
 * POST → 402 vira estado de quota (QuotaNotice), erro vira mensagem,
 * sucesso redireciona para o artefato criado. Usado por todos os forms
 * de geração (prova, atividade, plano de aula, plano de estudos, deck).
 */
export function useAiGenerate(endpoint: string, redirectTo: (id: string) => string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);

  async function generate(payload: FormData | Record<string, unknown>) {
    setError(null);
    setQuotaHit(false);
    const init: RequestInit =
      payload instanceof FormData
        ? { method: "POST", body: payload }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          };
    try {
      const res = await fetch(endpoint, init);
      const data = await res.json();
      if (res.status === 402) {
        setQuotaHit(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
      router.push(redirectTo(data.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  return { generate, error, quotaHit };
}
